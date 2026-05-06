import Employee from '../models/Employee.js';
import DailyStats from '../models/DailyStats.js';

// @desc    Get today's billing
// @route   GET /api/billing/today
export const getTodayBilling = async (req, res) => {
  try {
    const employees = await Employee.find();
    const today = new Date().toISOString().split('T')[0];
    const now = Date.now();

    const employeeBilling = [];
    let totalCost = 0;
    let totalPotential = 0;

    for (const emp of employees) {
      let workSeconds = emp.todayWorkSeconds;

      // Add current session if working
      if (emp.isWorking && emp.startTime && emp.lastWorkDate === today) {
        workSeconds += Math.floor((now - emp.startTime) / 1000);
      }

      const hours = workSeconds / 3600;
      const cost = Math.round(hours * emp.hourlyRate * 100) / 100;
      const potential = 24 * emp.hourlyRate;

      totalCost += cost;
      totalPotential += potential;

      // Format work time
      const h = Math.floor(workSeconds / 3600);
      const m = Math.floor((workSeconds % 3600) / 60);
      const s = workSeconds % 60;

      employeeBilling.push({
        id: emp._id,
        name: emp.name,
        emoji: emp.emoji,
        todayCost: cost,
        todayWorkTime: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`,
        hourlyRate: emp.hourlyRate,
        potentialCost: potential
      });
    }

    const totalSavings = Math.max(0, totalPotential - totalCost);

    res.json({
      success: true,
      data: {
        totalCost: Math.round(totalCost * 100) / 100,
        totalPotential: Math.round(totalPotential * 100) / 100,
        totalSavings: Math.round(totalSavings * 100) / 100,
        employees: employeeBilling
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get billing history
// @route   GET /api/billing/history
export const getBillingHistory = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const query = {};

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = startDate;
      if (endDate) query.date.$lte = endDate;
    }

    const history = await DailyStats.find(query).sort({ date: -1 });

    const totalCost = history.reduce((sum, h) => sum + (h.totalCost || 0), 0);
    const totalSavings = history.reduce((sum, h) => sum + (h.totalSavings || 0), 0);

    res.json({
      success: true,
      data: {
        daily: history.map(h => ({
          date: h.date,
          totalCost: h.totalCost,
          totalSavings: h.totalSavings,
          totalPotential: h.totalPotential,
          activeEmployees: h.activeEmployees
        })),
        summary: {
          totalCost: Math.round(totalCost * 100) / 100,
          totalSavings: Math.round(totalSavings * 100) / 100,
          period: history.length > 0
            ? `${history[history.length - 1].date} to ${history[0].date}`
            : 'No data'
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Generate daily stats (called by cron job)
// @route   POST /api/billing/generate-stats
export const generateDailyStats = async (req, res) => {
  try {
    const employees = await Employee.find();
    const today = new Date().toISOString().split('T')[0];

    let totalCost = 0;
    let totalPotential = 0;
    const employeeStats = [];

    // Reset work time and calculate for previous day
    for (const emp of employees) {
      const workHours = emp.todayWorkSeconds / 3600;
      const cost = workHours * emp.hourlyRate;
      const potential = 24 * emp.hourlyRate;

      totalCost += cost;
      totalPotential += potential;

      employeeStats.push({
        employeeId: emp._id,
        employeeName: emp.name,
        workSeconds: emp.todayWorkSeconds,
        cost: Math.round(cost * 100) / 100
      });

      // Reset for new day
      emp.todayWorkSeconds = 0;
      emp.lastWorkDate = today;
      if (emp.isWorking) {
        emp.startTime = Date.now();
      }
      await emp.save();
    }

    const totalSavings = Math.max(0, totalPotential - totalCost);

    // Check if stats already exist for today
    const existing = await DailyStats.findOne({ date: today });

    if (existing) {
      existing.totalCost = Math.round(totalCost * 100) / 100;
      existing.totalPotential = Math.round(totalPotential * 100) / 100;
      existing.totalSavings = Math.round(totalSavings * 100) / 100;
      existing.employeeStats = employeeStats;
      existing.activeEmployees = employees.filter(e => e.isWorking).length;
      existing.totalEmployees = employees.length;
      await existing.save();
    } else {
      await DailyStats.create({
        date: today,
        totalCost: Math.round(totalCost * 100) / 100,
        totalPotential: Math.round(totalPotential * 100) / 100,
        totalSavings: Math.round(totalSavings * 100) / 100,
        employeeStats,
        activeEmployees: employees.filter(e => e.isWorking).length,
        totalEmployees: employees.length
      });
    }

    res.json({
      success: true,
      message: 'Daily stats generated',
      data: {
        date: today,
        totalCost: Math.round(totalCost * 100) / 100,
        totalSavings: Math.round(totalSavings * 100) / 100
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
