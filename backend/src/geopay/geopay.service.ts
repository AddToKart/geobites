import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RewardPoints } from '../entities/reward-points.entity';
import { RewardTransaction } from '../entities/reward-transaction.entity';
import { Referral } from '../entities/referral.entity';

const POINTS_PER_PESO = 1;
const REDEMPTION_RATE = 10; // 10 points = 1 peso discount
const REFERRAL_BONUS_POINTS = 500; // 500 points per referral (₱50 discount value)

@Injectable()
export class GeopayService {
  constructor(
    @InjectRepository(RewardPoints)
    private readonly rewardPointsRepository: Repository<RewardPoints>,
    @InjectRepository(RewardTransaction)
    private readonly rewardTxRepository: Repository<RewardTransaction>,
    @InjectRepository(Referral)
    private readonly referralRepository: Repository<Referral>,
  ) {}

  async getRewardsBalance(userId: string) {
    let points = await this.rewardPointsRepository.findOne({
      where: { userId },
    });
    if (!points) {
      points = this.rewardPointsRepository.create({ userId });
      points = await this.rewardPointsRepository.save(points);
    }
    return {
      balance: points.balance,
      discountBalance: points.discountBalance,
      lifetimeEarned: points.lifetimeEarned,
      lifetimeRedeemed: points.lifetimeRedeemed,
      redeemableDiscount: Math.floor(points.balance / REDEMPTION_RATE),
    };
  }

  async getRewardHistory(userId: string) {
    return this.rewardTxRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }

  async awardPoints(userId: string, amountPesos: number, referenceId?: string) {
    const points = Math.floor(amountPesos * POINTS_PER_PESO);
    if (points <= 0) return null;

    let record = await this.rewardPointsRepository.findOne({
      where: { userId },
    });
    if (!record) {
      record = this.rewardPointsRepository.create({ userId });
    }
    record.balance += points;
    record.lifetimeEarned += points;
    await this.rewardPointsRepository.save(record);

    const tx = this.rewardTxRepository.create({
      userId,
      points,
      type: 'earned',
      cashValue: 0,
      description: `Earned from order`,
      referenceId,
    });
    return this.rewardTxRepository.save(tx);
  }

  async redeemPoints(userId: string, pointsToRedeem: number) {
    if (pointsToRedeem <= 0) {
      throw new BadRequestException('Points must be positive');
    }

    const discountPesos = Math.floor(pointsToRedeem / REDEMPTION_RATE);
    const actualPoints = discountPesos * REDEMPTION_RATE;

    if (actualPoints <= 0) {
      throw new BadRequestException(
        `Minimum redemption is ${REDEMPTION_RATE} points`,
      );
    }

    const record = await this.rewardPointsRepository.findOne({
      where: { userId },
    });
    if (!record || record.balance < actualPoints) {
      throw new BadRequestException('Insufficient reward points');
    }

    record.balance -= actualPoints;
    record.lifetimeRedeemed += actualPoints;
    record.discountBalance += discountPesos;
    await this.rewardPointsRepository.save(record);

    const rewardTx = this.rewardTxRepository.create({
      userId,
      points: -actualPoints,
      type: 'redeemed',
      cashValue: discountPesos,
      description: `Redeemed ₱${discountPesos} discount (${actualPoints} pts)`,
    });
    await this.rewardTxRepository.save(rewardTx);

    return {
      pointsRedeemed: actualPoints,
      discountPesos,
      newBalance: record.balance,
      discountBalance: record.discountBalance,
    };
  }

  async consumeDiscount(userId: string, discountPesos: number) {
    if (discountPesos <= 0) {
      throw new BadRequestException('Discount must be positive');
    }

    const record = await this.rewardPointsRepository.findOne({
      where: { userId },
    });
    if (!record || record.discountBalance < discountPesos) {
      throw new BadRequestException('Insufficient discount balance');
    }

    record.discountBalance -= discountPesos;
    await this.rewardPointsRepository.save(record);

    return {
      consumed: discountPesos,
      remainingDiscount: record.discountBalance,
    };
  }

  // ----- Referral -----

  async getReferralCode(userId: string) {
    let referral = await this.referralRepository.findOne({
      where: { referrerId: userId },
    });
    if (!referral) {
      const code = await this.generateUniqueCode();
      referral = this.referralRepository.create({
        referrerId: userId,
        referralCode: code,
      });
      referral = await this.referralRepository.save(referral);
    }
    return {
      referralCode: referral.referralCode,
      totalReferrals: await this.referralRepository.count({
        where: { referrerId: userId, status: 'rewarded' },
      }),
      pendingReferrals: await this.referralRepository.count({
        where: { referrerId: userId, status: 'pending' },
      }),
    };
  }

  async registerReferral(
    code: string,
    referredUserId: string,
    referredEmail?: string,
  ) {
    const referral = await this.referralRepository.findOne({
      where: { referralCode: code },
    });
    if (!referral) {
      throw new NotFoundException('Invalid referral code');
    }
    if (referral.referrerId === referredUserId) {
      throw new BadRequestException('Cannot refer yourself');
    }

    const existing = await this.referralRepository.findOne({
      where: { referredId: referredUserId },
    });
    if (existing) {
      throw new BadRequestException('User already referred');
    }

    referral.referredId = referredUserId;
    referral.referredEmail = referredEmail;
    await this.referralRepository.save(referral);

    return { success: true };
  }

  async rewardReferralOnFirstOrder(userId: string) {
    const referral = await this.referralRepository.findOne({
      where: { referredId: userId, status: 'pending' },
    });
    if (!referral) return null;

    referral.status = 'rewarded';
    referral.rewardAmount = 0;
    await this.referralRepository.save(referral);

    // Award points (no real money)
    let record = await this.rewardPointsRepository.findOne({
      where: { userId: referral.referrerId },
    });
    if (!record) {
      record = this.rewardPointsRepository.create({
        userId: referral.referrerId,
      });
    }
    record.balance += REFERRAL_BONUS_POINTS;
    record.lifetimeEarned += REFERRAL_BONUS_POINTS;
    await this.rewardPointsRepository.save(record);

    const rewardTx = this.rewardTxRepository.create({
      userId: referral.referrerId,
      points: REFERRAL_BONUS_POINTS,
      type: 'earned',
      cashValue: 0,
      description: `Referral reward — friend completed first order`,
    });
    await this.rewardTxRepository.save(rewardTx);

    return {
      referrerId: referral.referrerId,
      pointsAwarded: REFERRAL_BONUS_POINTS,
    };
  }

  async getReferralHistory(userId: string) {
    const referrals = await this.referralRepository.find({
      where: { referrerId: userId },
      order: { createdAt: 'DESC' },
    });
    return referrals.map((r) => ({
      id: r.id,
      referralCode: r.referralCode,
      referredEmail: r.referredEmail,
      status: r.status,
      rewardAmount: 0,
      createdAt: r.createdAt,
    }));
  }

  private async generateUniqueCode(): Promise<string> {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    for (let attempt = 0; attempt < 10; attempt++) {
      let code = '';
      for (let i = 0; i < 8; i++) {
        code += chars[Math.floor(Math.random() * chars.length)];
      }
      const existing = await this.referralRepository.findOne({
        where: { referralCode: code },
      });
      if (!existing) return code;
    }
    return `REF${Date.now().toString(36).toUpperCase()}`;
  }
}
