import { BadRequestException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { MenuItem } from '../entities/menu-item.entity';
import { OrderItem } from '../entities/order-item.entity';
import { Order } from '../entities/order.entity';
import { Vendor } from '../entities/vendor.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { OrdersService } from './orders.service';

describe('OrdersService', () => {
  let service: OrdersService;

  const orderRepository = {
    findOne: jest.fn(),
  };
  const orderItemRepository = {};
  const menuItemRepository = {};
  const vendorRepository = {
    findOne: jest.fn(),
  };
  const notificationsService = {
    create: jest.fn(),
  };

  const transactionVendorRepository = {
    findOne: jest.fn(),
  };
  const transactionMenuItemRepository = {
    find: jest.fn(),
  };
  const transactionOrderRepository = {
    create: jest.fn((data) => data),
    save: jest.fn(),
  };
  const transactionOrderItemRepository = {
    create: jest.fn((data) => data),
    save: jest.fn(),
  };
  const dataSource = {
    transaction: jest.fn(async (callback: (manager: unknown) => unknown) =>
      callback({
        getRepository: (entity: unknown) => {
          if (entity === Vendor) {
            return transactionVendorRepository;
          }
          if (entity === MenuItem) {
            return transactionMenuItemRepository;
          }
          if (entity === Order) {
            return transactionOrderRepository;
          }
          if (entity === OrderItem) {
            return transactionOrderItemRepository;
          }

          throw new Error('Unexpected repository request');
        },
      }),
    ),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        OrdersService,
        {
          provide: getRepositoryToken(Order),
          useValue: orderRepository,
        },
        {
          provide: getRepositoryToken(OrderItem),
          useValue: orderItemRepository,
        },
        {
          provide: getRepositoryToken(MenuItem),
          useValue: menuItemRepository,
        },
        {
          provide: getRepositoryToken(Vendor),
          useValue: vendorRepository,
        },
        {
          provide: NotificationsService,
          useValue: notificationsService,
        },
        {
          provide: DataSource,
          useValue: dataSource,
        },
      ],
    }).compile();

    service = moduleRef.get(OrdersService);
  });

  it('rejects duplicate menu items before opening a transaction', async () => {
    await expect(
      service.create(
        {
          vendorId: 'vendor-1',
          deliveryAddress: 'Santa Maria, Bulacan',
          items: [
            { menuItemId: 'menu-1', quantity: 1 },
            { menuItemId: 'menu-1', quantity: 2 },
          ],
        },
        'customer-1',
      ),
    ).rejects.toThrow(BadRequestException);

    expect(dataSource.transaction).not.toHaveBeenCalled();
  });

  it('rejects orders for inactive vendors', async () => {
    transactionVendorRepository.findOne.mockResolvedValue({
      id: 'vendor-1',
      userId: 'seller-1',
      isActive: false,
    });

    await expect(
      service.create(
        {
          vendorId: 'vendor-1',
          deliveryAddress: 'Santa Maria, Bulacan',
          items: [{ menuItemId: 'menu-1', quantity: 1 }],
        },
        'customer-1',
      ),
    ).rejects.toThrow('Vendor is not accepting orders right now');

    expect(notificationsService.create).not.toHaveBeenCalled();
  });

  it('creates the order transactionally and notifies the seller', async () => {
    transactionVendorRepository.findOne.mockResolvedValue({
      id: 'vendor-1',
      userId: 'seller-1',
      isActive: true,
    });
    transactionMenuItemRepository.find.mockResolvedValue([
      {
        id: 'menu-1',
        vendorId: 'vendor-1',
        name: 'Silog Meal',
        price: 120,
        isAvailable: true,
      },
    ]);
    transactionOrderRepository.save.mockResolvedValue({
      id: 'order-1',
      customerId: 'customer-1',
      vendorId: 'vendor-1',
      status: 'pending',
      totalAmount: 120,
      deliveryAddress: 'Santa Maria, Bulacan',
    });
    orderRepository.findOne.mockResolvedValue({
      id: 'order-1',
      customerId: 'customer-1',
      vendorId: 'vendor-1',
      status: 'pending',
      totalAmount: 120,
      deliveryAddress: 'Santa Maria, Bulacan',
      items: [],
      vendor: { id: 'vendor-1' },
    });

    const order = await service.create(
      {
        vendorId: 'vendor-1',
        deliveryAddress: 'Santa Maria, Bulacan',
        items: [{ menuItemId: 'menu-1', quantity: 1 }],
      },
      'customer-1',
    );

    expect(dataSource.transaction).toHaveBeenCalledTimes(1);
    expect(transactionOrderItemRepository.save).toHaveBeenCalledTimes(1);
    expect(notificationsService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'seller-1',
        title: 'New Order',
        referenceId: 'order-1',
      }),
    );
    expect(order).toEqual(
      expect.objectContaining({
        id: 'order-1',
        customerId: 'customer-1',
      }),
    );
  });
});
