import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';
import { Service } from '../services/entities/service.entity';
import { Booking, BookingStatus } from '../bookings/entities/booking.entity';

async function seed() {
  console.log('🌱 Starting database seed...');

  const dataSource = new DataSource({
    type: 'sqlite',
    database: process.env.DATABASE_URL?.replace('sqlite:', '') || './data/booking.db',
    entities: [User, Service, Booking],
    synchronize: true,
    logging: false,
  });

  await dataSource.initialize();
  console.log('📦 Database connected');

  const userRepo = dataSource.getRepository(User);
  const serviceRepo = dataSource.getRepository(Service);
  const bookingRepo = dataSource.getRepository(Booking);

  // ── Demo User ──────────────────────────────────────────────────────
  const existingUser = await userRepo.findOne({
    where: { email: 'admin@example.com' },
  });

  if (existingUser) {
    console.log('👤 Demo user already exists, skipping user creation');
  } else {
    const hashedPassword = await bcrypt.hash('password123', 10);
    const user = userRepo.create({
      email: 'admin@example.com',
      password: hashedPassword,
      name: 'Admin User',
    });
    await userRepo.save(user);
    console.log('✅ Created demo user: admin@example.com / password123');
  }

  const demoUser = await userRepo.findOneOrFail({
    where: { email: 'admin@example.com' },
  });

  // ── Services ───────────────────────────────────────────────────────
  const servicesData = [
    {
      title: 'Classic Haircut',
      description: 'A timeless haircut tailored to your style, including shampoo and blow-dry.',
      duration: 45,
      price: 35.00,
      isActive: true,
    },
    {
      title: 'Premium Haircut',
      description: 'Our signature haircut experience with premium products, hot towel, and scalp massage.',
      duration: 60,
      price: 55.00,
      isActive: true,
    },
    {
      title: 'Beard Grooming',
      description: 'Professional beard trim, shaping, and conditioning treatment.',
      duration: 30,
      price: 25.00,
      isActive: true,
    },
    {
      title: 'Hair Coloring',
      description: 'Full-color application with ammonia-free professional dyes.',
      duration: 120,
      price: 85.00,
      isActive: true,
    },
    {
      title: 'Deep Conditioning Treatment',
      description: 'Intensive hair repair treatment with organic oils and steam therapy.',
      duration: 45,
      price: 45.00,
      isActive: true,
    },
    {
      title: 'Kids Haircut',
      description: 'Gentle haircut service for children under 12 in a fun, friendly environment.',
      duration: 30,
      price: 20.00,
      isActive: false,
    },
    {
      title: 'Luxury Package',
      description: 'Full experience: haircut, beard grooming, facial steam, and shoulder massage.',
      duration: 90,
      price: 95.00,
      isActive: true,
    },
    {
      title: 'Express Trim',
      description: 'Quick trim and touch-up for existing styles. No wash included.',
      duration: 20,
      price: 18.00,
      isActive: true,
    },
  ];

  let createdCount = 0;
  for (const svc of servicesData) {
    const existing = await serviceRepo.findOne({
      where: { title: svc.title, userId: demoUser.id },
    });
    if (!existing) {
      const service = serviceRepo.create({
        ...svc,
        userId: demoUser.id,
      });
      await serviceRepo.save(service);
      createdCount++;
    }
  }
  console.log(`✅ Created ${createdCount} new services (${servicesData.length} total configured)`);

  // Fetch all services for booking creation
  const allServices = await serviceRepo.find({
    where: { userId: demoUser.id, isActive: true },
  });

  if (allServices.length === 0) {
    console.log('⚠️ No active services found, skipping bookings');
    await dataSource.destroy();
    return;
  }

  // ── Bookings ───────────────────────────────────────────────────────
  const today = new Date();
  const fmt = (d: Date) => d.toISOString().split('T')[0];

  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);

  const nextMonth = new Date(today);
  nextMonth.setMonth(nextMonth.getMonth() + 1);

  const lastWeek = new Date(today);
  lastWeek.setDate(lastWeek.getDate() - 7);

  const bookingsData = [
    {
      customerName: 'John Smith',
      customerEmail: 'john.smith@example.com',
      customerPhone: '+1-555-0100',
      serviceId: allServices[0].id,
      bookingDate: fmt(nextWeek),
      bookingTime: '09:00',
      status: BookingStatus.PENDING,
      notes: 'First time customer, prefers short cut',
    },
    {
      customerName: 'Emma Johnson',
      customerEmail: 'emma.j@example.com',
      customerPhone: '+1-555-0101',
      serviceId: allServices[Math.min(1, allServices.length - 1)].id,
      bookingDate: fmt(nextWeek),
      bookingTime: '10:30',
      status: BookingStatus.PENDING,
    },
    {
      customerName: 'Michael Brown',
      customerEmail: 'michael.brown@example.com',
      customerPhone: '+1-555-0102',
      serviceId: allServices[0].id,
      bookingDate: fmt(nextWeek),
      bookingTime: '14:00',
      status: BookingStatus.CONFIRMED,
      notes: 'Allergic to lavender products',
    },
    {
      customerName: 'Sophia Davis',
      customerEmail: 'sophia.d@example.com',
      customerPhone: '+1-555-0103',
      serviceId: allServices[Math.min(2, allServices.length - 1)].id,
      bookingDate: fmt(new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000)),
      bookingTime: '11:00',
      status: BookingStatus.CONFIRMED,
    },
    {
      customerName: 'James Wilson',
      customerEmail: 'james.w@example.com',
      customerPhone: '+1-555-0104',
      serviceId: allServices[Math.min(3, allServices.length - 1)].id,
      bookingDate: fmt(nextMonth),
      bookingTime: '15:30',
      status: BookingStatus.PENDING,
      notes: 'Wants to discuss pricing beforehand',
    },
    {
      customerName: 'Olivia Taylor',
      customerEmail: 'olivia.t@example.com',
      customerPhone: '+1-555-0105',
      serviceId: allServices[0].id,
      bookingDate: fmt(new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000)),
      bookingTime: '09:30',
      status: BookingStatus.COMPLETED,
    },
    {
      customerName: 'Daniel Anderson',
      customerEmail: 'daniel.a@example.com',
      customerPhone: '+1-555-0106',
      serviceId: allServices[Math.min(4, allServices.length - 1)].id,
      bookingDate: fmt(lastWeek),
      bookingTime: '16:00',
      status: BookingStatus.CANCELLED,
      notes: 'Had an emergency, will reschedule',
    },
    {
      customerName: 'Ava Thomas',
      customerEmail: 'ava.t@example.com',
      customerPhone: '+1-555-0107',
      serviceId: allServices[Math.min(1, allServices.length - 1)].id,
      bookingDate: fmt(today),
      bookingTime: '13:00',
      status: BookingStatus.CONFIRMED,
      notes: 'Birthday treat!',
    },
    {
      customerName: 'William Jackson',
      customerEmail: 'william.j@example.com',
      customerPhone: '+1-555-0108',
      serviceId: allServices[Math.min(5, allServices.length - 1)].id,
      bookingDate: fmt(nextWeek),
      bookingTime: '11:30',
      status: BookingStatus.PENDING,
    },
    {
      customerName: 'Mia Harris',
      customerEmail: 'mia.h@example.com',
      customerPhone: '+1-555-0109',
      serviceId: allServices[Math.min(3, allServices.length - 1)].id,
      bookingDate: fmt(new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000)),
      bookingTime: '10:00',
      status: BookingStatus.PENDING,
      notes: 'Prefers morning appointments',
    },
  ];

  let bookingCount = 0;
  for (const bk of bookingsData) {
    // Avoid duplicates: check if exact booking already exists
    const existing = await bookingRepo.findOne({
      where: {
        serviceId: bk.serviceId,
        customerEmail: bk.customerEmail,
        bookingDate: bk.bookingDate,
        bookingTime: bk.bookingTime,
      },
    });
    if (!existing) {
      const booking = bookingRepo.create(bk);
      await bookingRepo.save(booking);
      bookingCount++;
    }
  }
  console.log(`✅ Created ${bookingCount} new bookings (${bookingsData.length} total configured)`);

  // ── Summary ────────────────────────────────────────────────────────
  const userCount = await userRepo.count();
  const serviceCount = await serviceRepo.count();
  const bookingStats = await bookingRepo.count();
  console.log('');
  console.log('📊 Seed Summary:');
  console.log(`   Users:     ${userCount}`);
  console.log(`   Services:  ${serviceCount}`);
  console.log(`   Bookings:  ${bookingStats}`);
  console.log('');
  console.log('🔐 Demo credentials:');
  console.log(`   Email:    admin@example.com`);
  console.log(`   Password: password123`);
  console.log('');
  console.log('✨ Seed complete!');

  await dataSource.destroy();
  console.log('🔌 Database connection closed');
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
