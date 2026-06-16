import { getRepositoryToken } from '@nestjs/typeorm';
import { Test } from '@nestjs/testing';
import { IsNull, DataSource } from 'typeorm';
import { Order } from '../entities/order.entity';
import { RiderRating } from '../entities/rider-rating.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { WalletService } from '../wallet/wallet.service';
import { RidersService } from './riders.service';

describe('RidersService', () => {
  let service: RidersService;

  const orderRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
  };
  const riderRatingRepository = {
    createQueryBuilder: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    getRawOne: jest
      .fn()
      .mockResolvedValue({ totalRatings: '0', averageScore: null }),
  };
  const notificationsService = {
    create: jest.fn(),
  };
  const walletService = {
    handleOrderDeliveryPayout: jest.fn(),
  };
  const dataSource = {
    options: {
      type: 'postgres',
    },
    query: jest
      .fn()
      .mockResolvedValue([{ name: 'Test User', phone: '123456' }]),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        RidersService,
        {
          provide: getRepositoryToken(Order),
          useValue: orderRepository,
        },
        {
          provide: getRepositoryToken(RiderRating),
          useValue: riderRatingRepository,
        },
        {
          provide: NotificationsService,
          useValue: notificationsService,
        },
        {
          provide: WalletService,
          useValue: walletService,
        },
        {
          provide: DataSource,
          useValue: dataSource,
        },
      ],
    }).compile();

    service = moduleRef.get(RidersService);
  });

  it('notifies both customer and seller when a rider accepts a delivery', async () => {
    orderRepository.update.mockResolvedValue({ affected: 1 });
    orderRepository.findOne.mockResolvedValue({
      id: 'order-1',
      customerId: 'customer-1',
      status: 'ready_for_pickup',
      riderId: 'rider-1',
      vendor: {
        userId: 'seller-1',
      },
    });

    await service.acceptDelivery('order-1', 'rider-1');

    expect(orderRepository.update).toHaveBeenCalledWith(
      { id: 'order-1', status: 'accepted', riderId: IsNull() },
      { riderId: 'rider-1' },
    );
    expect(notificationsService.create).toHaveBeenCalledTimes(2);
    expect(notificationsService.create).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        userId: 'customer-1',
        title: 'Rider On The Way',
      }),
    );
    expect(notificationsService.create).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        userId: 'seller-1',
        title: 'Rider Accepted',
      }),
    );
  });

  it('notifies the customer when the rider marks the order as delivering', async () => {
    orderRepository.findOne.mockResolvedValue({
      id: 'order-1',
      customerId: 'customer-1',
      status: 'picked_up',
      riderId: 'rider-1',
      vendor: {
        userId: 'seller-1',
      },
    });
    orderRepository.save.mockImplementation(async (order) => order);

    await service.updateDeliveryStatus('order-1', 'rider-1', {
      status: 'delivering',
    });

    expect(orderRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'delivering',
      }),
    );
    expect(notificationsService.create).toHaveBeenCalledTimes(1);
    expect(notificationsService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'customer-1',
        title: 'Order On The Way',
      }),
    );
  });
});
