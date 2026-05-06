import mongoose from 'mongoose';
import Employee from '../models/Employee.js';
import Activity from '../models/Activity.js';
import DailyStats from '../models/DailyStats.js';

const employees = [
  {
    name: '小助手',
    role: 'assistant',
    emoji: '🦞',
    tier: 'low',
    modelType: 'normal',
    cpu: 1,
    mem: 2,
    disk: 10,
    hourlyRate: 1,
    idleRate: 0.2,
    isWorking: true,
    todayWorkSeconds: 7200,
    totalWorkSeconds: 86400,
    totalSessions: 12,
    totalEarnings: 24,
    lastWorkDate: new Date().toISOString().split('T')[0]
  },
  {
    name: '代码专家',
    role: 'coder',
    emoji: '💻',
    tier: 'medium',
    modelType: 'advanced',
    cpu: 2,
    mem: 4,
    disk: 40,
    hourlyRate: 3,
    idleRate: 0.2,
    isWorking: true,
    todayWorkSeconds: 14400,
    totalWorkSeconds: 172800,
    totalSessions: 18,
    totalEarnings: 144,
    lastWorkDate: new Date().toISOString().split('T')[0]
  },
  {
    name: '设计师',
    role: 'creative',
    emoji: '🎨',
    tier: 'high',
    modelType: 'advanced',
    cpu: 4,
    mem: 8,
    disk: 40,
    hourlyRate: 6,
    idleRate: 0.2,
    isWorking: false,
    todayWorkSeconds: 3600,
    totalWorkSeconds: 43200,
    totalSessions: 8,
    totalEarnings: 72,
    lastWorkDate: new Date().toISOString().split('T')[0]
  }
];

const activities = [
  {
    employeeName: '小助手',
    message: '小助手 开始工作',
    type: 'work',
    timestamp: Date.now() - 3600000
  },
  {
    employeeName: '代码专家',
    message: '代码专家 开始工作',
    type: 'work',
    timestamp: Date.now() - 7200000
  },
  {
    employeeName: '设计师',
    message: '设计师 加入团队',
    type: 'hire',
    timestamp: Date.now() - 86400000
  }
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/clawcloud');
    console.log('Connected to MongoDB');

    // Clear existing data
    await Employee.deleteMany({});
    await Activity.deleteMany({});
    await DailyStats.deleteMany({});
    console.log('Cleared existing data');

    // Insert employees
    const createdEmployees = await Employee.insertMany(employees);
    console.log(`Created ${createdEmployees.length} employees`);

    // Link activities to employees
    for (let i = 0; i < activities.length; i++) {
      activities[i].employeeId = createdEmployees[i % createdEmployees.length]._id;
    }
    await Activity.insertMany(activities);
    console.log(`Created ${activities.length} activities`);

    // Create some daily stats
    const today = new Date();
    for (let i = 1; i <= 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      const cost = 15 + Math.random() * 20;
      const potential = 45;
      await DailyStats.create({
        date: dateStr,
        totalCost: Math.round(cost * 100) / 100,
        totalPotential: potential,
        totalSavings: Math.round((potential - cost) * 100) / 100,
        activeEmployees: 2,
        totalEmployees: 3,
        employeeStats: []
      });
    }
    console.log('Created 7 days of stats');

    console.log('Seed completed!');
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
}

seed();
