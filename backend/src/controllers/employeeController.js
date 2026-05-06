import Employee from '../models/Employee.js';
import Activity from '../models/Activity.js';

const pricing = Employee.getPricingConfig();

// @desc    Get all employees
// @route   GET /api/employees
export const getEmployees = async (req, res) => {
  try {
    const employees = await Employee.find().sort({ createdAt: -1 });

    // Check and update work time for working employees
    const now = Date.now();
    const today = new Date().toISOString().split('T')[0];

    for (const emp of employees) {
      if (emp.isWorking && emp.startTime) {
        if (emp.lastWorkDate !== today) {
          // New day, reset today's work time
          emp.todayWorkSeconds = 0;
          emp.lastWorkDate = today;
        }
        const elapsed = Math.floor((now - emp.startTime) / 1000);
        emp.todayWorkSeconds += elapsed;
        emp.totalWorkSeconds += elapsed;
        emp.startTime = now; // Reset start time to now
        await emp.save();
      }
    }

    res.json({
      success: true,
      data: await Employee.find().sort({ createdAt: -1 })
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single employee
// @route   GET /api/employees/:id
export const getEmployee = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }
    res.json({ success: true, data: employee });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create new employee
// @route   POST /api/employees
export const createEmployee = async (req, res) => {
  try {
    const { name, role, tier, modelType } = req.body;

    // Validate tier and model type
    if (tier === 'low' && modelType === 'advanced') {
      return res.status(400).json({
        success: false,
        message: 'Advanced models not available for Lite tier'
      });
    }

    const tierConfig = pricing[tier];
    const hourlyRate = modelType === 'advanced'
      ? tierConfig.advanced
      : tierConfig.normal;

    // Generate emoji based on role
    const roleEmojis = {
      assistant: '🦞',
      coder: '💻',
      creative: '🎨'
    };

    const employee = await Employee.create({
      name,
      role,
      emoji: roleEmojis[role] || '🦞',
      tier,
      modelType,
      cpu: tierConfig.cpu,
      mem: tierConfig.mem,
      disk: tierConfig.disk,
      hourlyRate,
      idleRate: pricing.idleRate,
      lastWorkDate: new Date().toISOString().split('T')[0]
    });

    // Log activity
    await Activity.create({
      employeeId: employee._id,
      employeeName: employee.name,
      message: `${employee.name} 加入团队`,
      type: 'hire'
    });

    res.status(201).json({ success: true, data: employee });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Update employee
// @route   PUT /api/employees/:id
export const updateEmployee = async (req, res) => {
  try {
    const { name, role, tier, modelType } = req.body;

    // Validate tier and model type
    if (tier === 'low' && modelType === 'advanced') {
      return res.status(400).json({
        success: false,
        message: 'Advanced models not available for Lite tier'
      });
    }

    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    // Update pricing if tier or model changed
    const tierConfig = pricing[tier];
    const hourlyRate = modelType === 'advanced'
      ? tierConfig.advanced
      : tierConfig.normal;

    employee.name = name || employee.name;
    employee.role = role || employee.role;
    employee.tier = tier || employee.tier;
    employee.modelType = modelType || employee.modelType;
    employee.cpu = tierConfig.cpu;
    employee.mem = tierConfig.mem;
    employee.disk = tierConfig.disk;
    employee.hourlyRate = hourlyRate;

    // Update emoji based on role
    const roleEmojis = {
      assistant: '🦞',
      coder: '💻',
      creative: '🎨'
    };
    employee.emoji = roleEmojis[employee.role] || '🦞';

    await employee.save();

    res.json({ success: true, data: employee });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Toggle employee work status
// @route   PUT /api/employees/:id/toggle
export const toggleEmployee = async (req, res) => {
  try {
    const { isWorking } = req.body;
    const employee = await Employee.findById(req.params.id);

    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    const today = new Date().toISOString().split('T')[0];
    const now = Date.now();

    // Update work time before toggling
    if (employee.isWorking && employee.startTime && employee.lastWorkDate === today) {
      const elapsed = Math.floor((now - employee.startTime) / 1000);
      employee.todayWorkSeconds += elapsed;
      employee.totalWorkSeconds += elapsed;
      employee.totalEarnings += (elapsed / 3600) * employee.hourlyRate;
    }

    // Reset for new day if needed
    if (employee.lastWorkDate !== today) {
      employee.todayWorkSeconds = 0;
      employee.lastWorkDate = today;
    }

    if (isWorking && !employee.isWorking) {
      // Starting work
      employee.isWorking = true;
      employee.startTime = now;
      employee.totalSessions += 1;

      await Activity.create({
        employeeId: employee._id,
        employeeName: employee.name,
        message: `${employee.name} 开始工作`,
        type: 'work'
      });
    } else if (!isWorking && employee.isWorking) {
      // Stopping work
      employee.isWorking = false;
      employee.startTime = undefined;

      await Activity.create({
        employeeId: employee._id,
        employeeName: employee.name,
        message: `${employee.name} 停止工作`,
        type: 'stop'
      });
    }

    await employee.save();

    res.json({ success: true, data: employee });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Delete employee
// @route   DELETE /api/employees/:id
export const deleteEmployee = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);

    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    await Activity.create({
      employeeId: employee._id,
      employeeName: employee.name,
      message: `${employee.name} 已被移除`,
      type: 'delete'
    });

    await Employee.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: 'Employee deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Clone employee
// @route   POST /api/employees/:id/clone
export const cloneEmployee = async (req, res) => {
  try {
    const original = await Employee.findById(req.params.id);

    if (!original) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    const cloneData = original.toObject();
    delete cloneData._id;
    delete cloneData.createdAt;
    delete cloneData.updatedAt;
    cloneData.name = `${original.name} (副本)`;
    cloneData.isWorking = false;
    cloneData.startTime = undefined;
    cloneData.todayWorkSeconds = 0;
    cloneData.totalWorkSeconds = 0;
    cloneData.totalSessions = 0;
    cloneData.totalEarnings = 0;
    cloneData.lastWorkDate = new Date().toISOString().split('T')[0];

    const clone = await Employee.create(cloneData);

    await Activity.create({
      employeeId: clone._id,
      employeeName: clone.name,
      message: `${clone.name} 已克隆`,
      type: 'clone'
    });

    res.status(201).json({ success: true, data: clone });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
