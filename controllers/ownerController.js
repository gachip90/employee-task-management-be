const ownerModel = require('../models/owner'); 
const SMSService = require('../services/smsService');
const nodemailer = require("nodemailer");

// Generate Access Code
function generateAccessCode() {
  const code = Math.floor(100000 + Math.random() * 900000);
  return code.toString();
}

// Config Transporter For Nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER, 
    pass: process.env.GMAIL_PASS, 
  },
});

// Create New Access Code
exports.createNewAccessCode = async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    
    if (!phoneNumber) {
      return res.status(400).json({ 
        error: "Phone number is required",
        success: false 
      });
    }
    
    if (!SMSService.validatePhoneNumber(phoneNumber)) {
      return res.status(400).json({ 
        error: "Invalid phone number format. Please use international format (+84xxxxxxxxx)",
        success: false 
      });
    }
    
    const normalizedPhone = SMSService.normalizePhoneNumber(phoneNumber);
    
    const accessCode = generateAccessCode();
    
    await ownerModel.saveOwnerAccessCode(normalizedPhone, accessCode);
    
    try {
      const smsResult = await SMSService.sendAccessCode(normalizedPhone, accessCode);
      
      res.status(200).json({
        success: true,
        message: "Access code sent successfully via SMS",
        phoneNumber: normalizedPhone,
        messageSid: smsResult.messageSid,
        ...(process.env.NODE_ENV === 'development' && { accessCode: accessCode })
      });
      
    } catch (smsError) {
      res.status(200).json({
        success: true,
        message: "Access code created but SMS sending failed",
        phoneNumber: normalizedPhone,
        accessCode: accessCode, 
        smsError: smsError.message
      });
    }
    
  } catch (error) {
    console.error('Error in create new access code:', error);
    res.status(500).json({ 
      error: "Internal server error",
      success: false,
      message: error.message 
    });
  }
};

// Validate Access Code
exports.validateAccessCode = async (req, res) => {
  try {
    const { accessCode, phoneNumber } = req.body;
    
    if (!accessCode || !phoneNumber) {
      return res.status(400).json({ 
        error: "Access code and phone number are required",
        success: false 
      });
    }
    
    const normalizedPhone = SMSService.normalizePhoneNumber(phoneNumber);
    
    const owner = await ownerModel.getOwner(normalizedPhone);
    
    if (!owner) {
      return res.status(404).json({ 
        error: "Owner not found",
        success: false 
      });
    }
    
    if (owner.accessCode !== accessCode) {
      return res.status(401).json({ 
        error: "Invalid access code",
        success: false 
      });
    }
    
    await ownerModel.clearOwnerAccessCode(normalizedPhone);
    
    res.json({ 
      success: true,
      message: "Access code validated successfully",
      ownerId: owner.id,
      phoneNumber: normalizedPhone,
    });
    
  } catch (error) {
    console.error('Error validating access code:', error);
    res.status(500).json({ 
      error: "Internal server error",
      success: false,
      message: error.message 
    });
  }
};

// Get All Employees
exports.getAllEmployees = async (res) => {
  try {
    const employees = await ownerModel.getAllEmployees();

    const sanitizedEmployees = employees.map(({ accessCode, ...rest }) => rest);

    res.json({
      success: true,
      employees: sanitizedEmployees,
    });
  } catch (error) {
    console.error('Error getting all employees:', error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      message: error.message,
    });
  }
};

// Get An Employee
exports.getEmployee = async (req, res) => {
  try {
    const { employeeId } = req.params; 
    
    if (!employeeId) {
      return res.status(400).json({ 
        error: "EmployeeId is required",
        success: false 
      });
    }
    
    const employee = await ownerModel.getEmployee(employeeId); 
    
    if (!employee) {
      return res.status(404).json({ 
        error: "Employee not found",
        success: false 
      });
    }
    
    const { accessCode, ...employeeData } = employee;
    
    res.json({ 
      success: true,
      employee: employeeData
    });
    
  } catch (error) {
    console.error('Error getting employee:', error);
    res.status(500).json({ 
      error: "Internal server error",
      success: false,
      message: error.message 
    });
  }
};

// Create Employee
exports.createEmployee = async (req, res) => {
  try {
    const { name, email, role, phoneNumber, address } = req.body;

    if (!name || !email || !role) {
      return res.status(400).json({
        error: "Name, email, and role are required",
        success: false,
      });
    }

    const existingEmployee = await ownerModel.getEmployeeByEmail(email);
    if (existingEmployee) {
      return res.status(409).json({
        error: "Employee with this email already exists",
        success: false,
      });
    }

    const accessCode = generateAccessCode();

    const employeeData = {
      name,
      email,
      role,
      accessCode,
      createdAt: new Date(),
    };

    if (phoneNumber) employeeData.phoneNumber = phoneNumber;
    if (address) employeeData.address = address;

    const employeeId = await ownerModel.createEmployee(employeeData);

    const mailOptions = {
      from: `"Skipli" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: 'Your Access Code',
      text: `Dear ${name},\n\nYour access code is: ${accessCode}\n\nPlease use this code to access the system.\n\nClick here to access the system: http://localhost:3000/\n\nBest regards,\nSkipli`,
  html: `<p>Dear ${name},</p><p>Your access code is: <strong>${accessCode}</strong></p><p>Please use this code to access the system.</p><p>Click <a href="http://localhost:3000/">here</a> to access the system.</p><p>Best regards,<br>Skipli</p>`,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${email} with access code: ${accessCode}`);

    res.status(201).json({
      success: true,
      message: "Employee created successfully and access code sent to email",
      employeeId: employeeId,
    });

  } catch (error) {
    console.error('Error creating employee or sending email:', error);
    res.status(500).json({
      error: "Internal server error",
      success: false,
      message: error.message,
    });
  }
};

// Update Employee
exports.updateEmployee = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { name, email, role, phoneNumber, address } = req.body;

    if (!employeeId) {
      return res.status(400).json({
        success: false,
        error: "Employee ID is required",
      });
    }

    if (!name || !email || !role) {
      return res.status(400).json({
        success: false,
        error: "Name, email, and role are required",
      });
    }

    const existingEmployee = await ownerModel.getEmployee(employeeId);
    if (!existingEmployee) {
      return res.status(404).json({
        success: false,
        error: "Employee not found",
      });
    }

    if (email !== existingEmployee.email) {
      const emailConflict = await ownerModel.getEmployeeByEmail(email);
      if (emailConflict && emailConflict.id !== employeeId) {
        return res.status(409).json({
          success: false,
          error: "Another employee with this email already exists",
        });
      }
    }

    const updatedData = {
      name,
      email,
      role,
    };

    if (phoneNumber) updatedData.phoneNumber = phoneNumber;
    if (address) updatedData.address = address;

    await ownerModel.updateEmployee(employeeId, updatedData);

    res.status(200).json({
      success: true,
      message: "Employee updated successfully",
    });
  } catch (error) {
    console.error("Error updating employee:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      message: error.message,
    });
  }
};

// Delete Employee
exports.deleteEmployee = async (req, res) => {
  try {
    const { employeeId } = req.body;
    
    if (!employeeId) {
      return res.status(400).json({ 
        error: "Employee ID is required",
        success: false 
      });
    }
    
    const employee = await ownerModel.getEmployee(employeeId);
    if (!employee) {
      return res.status(404).json({ 
        error: "Employee not found",
        success: false 
      });
    }
    
    await ownerModel.deleteEmployee(employeeId);
    
    res.json({ 
      success: true,
      message: "Employee deleted successfully"
    });
    
  } catch (error) {
    console.error('Error deleting employee:', error);
    res.status(500).json({ 
      error: "Internal server error",
      success: false,
      message: error.message 
    });
  }
};

// Update Work Schedule
exports.updateWorkSchedule = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { workSchedule } = req.body;

    if (!employeeId) {
      return res.status(400).json({
        success: false,
        error: "Employee ID is required",
      });
    }

    if (
      !workSchedule ||
      typeof workSchedule !== "object" ||
      Array.isArray(workSchedule)
    ) {
      return res.status(400).json({
        success: false,
        error: "workSchedule must be a valid object",
      });
    }

    const validDays = [
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
      "sunday",
    ];

    for (const day of validDays) {
      if (!(day in workSchedule)) {
        return res.status(400).json({
          success: false,
          error: `Missing schedule for ${day}`,
        });
      }

      const value = workSchedule[day];
      if (
        value !== "off" &&
        !/^\d{2}:\d{2}-\d{2}:\d{2}$/.test(value)
      ) {
        return res.status(400).json({
          success: false,
          error: `Invalid time format for ${day}. Expected "HH:mm-HH:mm" or "off"`,
        });
      }
    }

    const existingEmployee = await ownerModel.getEmployee(employeeId);
    if (!existingEmployee) {
      return res.status(404).json({
        success: false,
        error: "Employee not found",
      });
    }

    await ownerModel.updateWorkSchedule(employeeId, workSchedule);

    res.status(200).json({
      success: true,
      message: "Work schedule updated successfully",
    });
  } catch (error) {
    console.error("Error updating work schedule:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      message: error.message,
    });
  }
};

// Get All Tasks
exports.getAllTasks = async (req, res) => {
  try {
    const { employeeId } = req.query;
    
    const tasks = await ownerModel.getAllTasks(employeeId);
    
    if (!tasks || tasks.length === 0) {
      return res.status(404).json({
        error: "No tasks found",
        success: false
      });
    }

    res.json({
      success: true,
      message: "Tasks retrieved successfully",
      data: tasks
    });

  } catch (error) {
    console.error('Error getting all tasks:', error);
    res.status(500).json({
      error: "Internal server error",
      success: false,
      message: error.message
    });
  }
};

// Create Task
exports.createTask = async (req, res) => {
  try {
    const { title, assignedName, employeeId, status, description } = req.body;

    if (!title || !assignedName || !employeeId || !status) {
      return res.status(400).json({
        error: "Title, assignedName, employeeId, and status are required",
        success: false
      });
    }

    const employee = await ownerModel.getEmployee(employeeId);
    if (!employee) {
      return res.status(404).json({
        error: "Employee not found",
        success: false
      });
    }

    const taskId = await ownerModel.createTask({
      title,
      assignedName,
      employeeId,
      status,
      description
    });

    res.json({
      success: true,
      message: "Task created successfully",
      data: { taskId }
    });

  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({
      error: "Internal server error",
      success: false,
      message: error.message
    });
  }
};

// Update Task
exports.updateTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { title, assignedName, employeeId, status, description } = req.body;

    if (!title || !assignedName || !employeeId || !status) {
      return res.status(400).json({
        error: "Title, assignedName, employeeId, and status are required",
        success: false
      });
    }

    const employee = await ownerModel.getEmployee(employeeId);
    if (!employee) {
      return res.status(404).json({
        error: "Employee not found",
        success: false
      });
    }

    const updatedTaskId = await ownerModel.updateTask(taskId, {
      title,
      assignedName,
      employeeId,
      status,
      description
    });

    res.json({
      success: true,
      message: "Task updated successfully",
      data: { taskId: updatedTaskId }
    });

  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({
      error: "Internal server error",
      success: false,
      message: error.message
    });
  }
};

// Delete Task 
exports.deleteTask = async (req, res) => {
  try {
    const { taskId } = req.body;
    
    if (!taskId) {
      return res.status(400).json({ 
        error: "Task ID is required",
        success: false 
      });
    }
    
    const task = await ownerModel.getTask(taskId);
    if (!task) {
      return res.status(404).json({ 
        error: "Task not found",
        success: false 
      });
    }
    
    await ownerModel.deleteTask(taskId);
    
    res.json({ 
      success: true,
      message: "Task deleted successfully"
    });
    
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ 
      error: "Internal server error",
      success: false,
      message: error.message 
    });
  }
};

