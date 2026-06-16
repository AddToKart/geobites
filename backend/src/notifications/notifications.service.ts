import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from '../entities/notification.entity';
import { QueryNotificationsDto } from './dto/query-notifications.dto';
import { EventsGateway } from '../events/events.gateway';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    private readonly eventsGateway: EventsGateway,
  ) {}

  async findForUser(userId: string, query: QueryNotificationsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 50;
    const skip = (page - 1) * limit;

    const qb = this.notificationRepository
      .createQueryBuilder('notification')
      .where('notification.userId = :userId', { userId })
      .orderBy('notification.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    if (query.unreadOnly) {
      qb.andWhere('notification.isRead = :isRead', { isRead: false });
    }

    const [data, total] = await qb.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
    };
  }

  async markAsRead(id: string, userId: string): Promise<Notification> {
    const notification = await this.notificationRepository.findOne({
      where: { id, userId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    notification.isRead = true;
    return this.notificationRepository.save(notification);
  }

  async getUnreadCount(userId: string): Promise<{ count: number }> {
    const count = await this.notificationRepository.count({
      where: { userId, isRead: false },
    });
    return { count };
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationRepository.update(
      { userId, isRead: false },
      { isRead: true },
    );
  }

  async create(data: Partial<Notification>) {
    const notification = this.notificationRepository.create({
      type: 'system',
      isRead: false,
      ...data,
    });
    const saved = await this.notificationRepository.save(notification);
    if (saved.userId) {
      this.eventsGateway.emitNotification(saved.userId, {
        id: saved.id,
        title: saved.title,
        message: saved.message,
        type: saved.type,
        referenceId: saved.referenceId,
      });
    }
    return saved;
  }
}
