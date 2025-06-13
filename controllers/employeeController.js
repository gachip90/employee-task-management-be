const employeeModel = require('../models/employee'); 

// Validate email access code
exports.validateEmailAccessCode = async (req, res) => {
  try {
    const { email, accessCode } = req.body;

    if (!email || !accessCode) {
      return res.status(400).json({
        success: false,
        error: "Email and access code are required"
      });
    }

    const employee = await employeeModel.getEmployeeByEmail(email);
    if (!employee) {
      return res.status(404).json({
        success: false,
        error: "Employee not found"
      });
    }

    if (employee.accessCode !== accessCode) {
      return res.status(401).json({
        success: false,
        error: "Invalid access code"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Access code validated successfully",
      employeeId: employee.employeeId,
      name: employee.name,
      email: employee.email,
      role: employee.role
    });

  } catch (error) {
    console.error("Error validating employee access code:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
      message: error.message
    });
  }
};
