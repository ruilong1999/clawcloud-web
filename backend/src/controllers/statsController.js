import Employee from '../models/Employee.js';
import DailyStats from '../models/DailyStats.js';

// @desc    Get dashboard stats
// @route   GET /api/stats/dashboard
export const getDashboardStats = async (req, res) => {
  try {
    const employees = await Employee.find();
    const today = new Date().toISOString().split('T')[0];
    const now = Date.now();

    let workingCount = 0;
    let todayCost = 0;
    let todayPotential = 0;
    let cpuUsed = 0;
    let memUsed = 0;
    let diskUsed = 0;

    // Update work time for working employees
    for (const emp of employees) {
      cpuUsed += emp.cpu;
      memUsed += emp.mem;
      diskUsed += emp.disk;

      if (emp.isWorking && emp.startTime) {
        workingCount++;
        const elapsed = emp.lastWorkDate === today
          ? Math.floor((now - emp.startTime) / 1000)
          : 0;

        const totalSeconds = emp.todayWorkSeconds + elapsed;
        const hours = totalSeconds / 3600;
        todayCost += hours * emp.hourlyRate;
        todayPotential += 24 * emp.hourlyRate;
      } else {
        // Still count potential for non-working employees
        todayPotential += 24 * emp.hourlyRate;
      }
    }

    // Get week stats
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekStats = await DailyStats.find({
      date: { $gte: weekAgo.toISOString().split('T')[0] }
    });

    const weekSavings = weekStats.reduce((sum, stat) => sum + (stat.totalSavings || 0), 0);

    // Calculate totals for resources
    const maxCpu = 32;
    const maxMem = 128;
    const maxDisk = 1000;

    const savings = Math.max(0, todayPotential - todayCost);
    const savingsPercent = todayPotential > 0 ? Math.round((savings / todayPotential) * 100) : 0;

    res.json({
      success: true,
      data: {
        totalEmployees: employees.length,
        workingEmployees: workingCount,
        todayCost: Math.round(todayCost * 100) / 100,
        todaySavings: Math.round(savings * 100) / 100,
        savingsPercentage: savingsPercent,
        resourceUsage: {
          cpu: {
            used: cpuUsed,
            total: maxCpu,
            percentage: Math.round((cpuUsed / maxCpu) * 100)
          },
          memory: {
            used: memUsed,
            total: maxMem,
            percentage: Math.round((memUsed / maxMem) * 100)
          },
          storage: {
            used: diskUsed,
            total: maxDisk,
            percentage: Math.round((diskUsed / maxDisk) * 100)
          }
        },
        weekSavings: Math.round(weekSavings * 100) / 100,
        efficiency: Math.min(100, Math.round((workingCount / Math.max(1, employees.length)) * 100))
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get usage trend for charts
// @route   GET /api/stats/usage-trend
export const getUsageTrend = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const today = new Date();

    const labels = [];
    const actualCost = [];
    const potential247 = [];
    const savings = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      // Generate label
      if (i === 0) {
        labels.push('今天');
      } else {
        const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
        labels.push(dayNames[date.getDay()]);
      }

      // Get stats for this day
      const stats = await DailyStats.findOne({ date: dateStr });

      if (stats) {
        actualCost.push(stats.totalCost);
        potential247.push(stats.totalPotential);
        savings.push(stats.totalSavings);
      } else {
        actualCost.push(0);
        potential247.push(0);
        savings.push(0);
      }
    }

    res.json({
      success: true,
      data: {
        labels,
        actualCost,
        potential247,
        savings
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get activities log
// @route   GET /api/activities
export const getActivities = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const activities = await Activity.find()
      .sort({ timestamp: -1 })
      .limit(limit);

    res.json({
      success: true,
      data: activities
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
