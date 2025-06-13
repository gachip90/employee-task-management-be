const { db, admin } = require('../firebase-config');

class Owner {
  // Save owner access code
  async saveOwnerAccessCode(phoneNumber, accessCode) {
    try {
      await db.collection('owners').doc(phoneNumber).set({
        phoneNumber: phoneNumber,
        accessCode: accessCode,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        isVerified: false
      });

      return true;
    } catch (error) {
      console.error('Error saving owner access code:', error);
      throw error;
    }
  }

  // Get owner
  async getOwner(phoneNumber) {
    try {
      const doc = await db.collection('owners').doc(phoneNumber).get();

      if (!doc.exists) {
        return null;
      }

      return {
        id: doc.id,
        ...doc.data()
      };
    } catch (error) {
      console.error('Error getting owner:', error);
      throw error;
    }
  }

  // Clear owner access code
  async clearOwnerAccessCode(phoneNumber) {
    try {
      await db.collection('owners').doc(phoneNumber).update({
        accessCode: "",
        isVerified: true,
        lastLogin: admin.firestore.FieldValue.serverTimestamp()
      });

      return true;
    } catch (error) {
      console.error('Error clearing owner access code:', error);
      throw error;
    }
  }

  // Create employee
  async createEmployee(employeeData) {
    try {
      const existingEmployee = await db.collection('employees')
        .where('email', '==', employeeData.email)
        .get();

      if (!existingEmployee.empty) {
        throw new Error('Employee with this email already exists');
      }

      const employeeId = `emp_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

      const newEmployee = {
        employeeId,
        name: employeeData.name,
        email: employeeData.email,
        phoneNumber: employeeData.phoneNumber || '',
        address: employeeData.address || '',
        role: employeeData.role || 'Developer',
        accessCode: employeeData.accessCode || '',
        isActive: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        lastLogin: null,
        workSchedule: {
          monday: '09:00-17:00',
          tuesday: '09:00-17:00',
          wednesday: '09:00-17:00',
          thursday: '09:00-17:00',
          friday: '09:00-17:00',
          saturday: 'off',
          sunday: 'off'
        },
        profilePicture: ''
      };

      await db.collection('employees').doc(employeeId).set(newEmployee);

      return employeeId;
    } catch (error) {
      console.error('Error creating employee:', error);
      throw error;
    }
  }

  // Get employee
  async getEmployee(employeeId) {
    try {
      const doc = await db.collection('employees').doc(employeeId).get();

      if (!doc.exists) {
        return null;
      }

      return {
        id: doc.id,
        ...doc.data()
      };
    } catch (error) {
      console.error('Error getting employee:', error);
      throw error;
    }
  }

  // Get employee by email
  async getEmployeeByEmail(email) {
    try {
      const snapshot = await db.collection('employees')
        .where('email', '==', email)
        .limit(1)
        .get();

      if (snapshot.empty) {
        return null;
      }

      const doc = snapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data()
      };
    } catch (error) {
      console.error('Error getting employee by email:', error);
      throw error;
    }
  }

  // Get all employees
  async getAllEmployees() {
    try {
      const snapshot = await db.collection('employees')
        .where('isActive', '==', true)
        .orderBy('createdAt', 'desc')
        .get();

      const employees = [];
      snapshot.forEach(doc => {
        employees.push({
          id: doc.id,
          ...doc.data()
        });
      });

      return employees;
    } catch (error) {
      console.error('Error getting all employees:', error);
      throw error;
    }
  }

  // Update employee
  async updateEmployee(employeeId, updatedData) {
    try {
      const requiredFields = ['name', 'email', 'role'];
      for (const field of requiredFields) {
        if (!updatedData[field]) {
          throw new Error(`${field} is required`);
        }
      }

      const allowedFields = ['name', 'email', 'role', 'phoneNumber', 'address'];
      const updatePayload = {};

      for (const field of allowedFields) {
        if (field in updatedData) {
          updatePayload[field] = updatedData[field];
        }
      }

      updatePayload.updatedAt = admin.firestore.FieldValue.serverTimestamp();

      await db.collection('employees').doc(employeeId).update(updatePayload);
      return true;

    } catch (error) {
      console.error('Error updating employee:', error);
      throw error;
    }
  }

  // Delete employee
  async deleteEmployee(employeeId) {
    try {
      await db.collection('employees').doc(employeeId).update({
        isActive: false,
        deletedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      return true;
    } catch (error) {
      console.error('Error deleting employee:', error);
      throw error;
    }
  }

  // Update work schedule
  async updateWorkSchedule(employeeId, workSchedule) {
    try {
      if (!employeeId) {
        throw new Error('employeeId is required');
      }

      if (
        !workSchedule ||
        typeof workSchedule !== 'object' ||
        Array.isArray(workSchedule)
      ) {
        throw new Error('workSchedule must be a valid object');
      }

      const validDays = [
        'monday',
        'tuesday',
        'wednesday',
        'thursday',
        'friday',
        'saturday',
        'sunday',
      ];

      for (const day of validDays) {
        if (!(day in workSchedule)) {
          throw new Error(`Missing schedule for ${day}`);
        }

        const value = workSchedule[day];
        if (
          value !== 'off' &&
          !/^\d{2}:\d{2}-\d{2}:\d{2}$/.test(value)
        ) {
          throw new Error(
            `Invalid time format for ${day}. Expected "HH:mm-HH:mm" or "off"`
          );
        }
      }

      await db.collection('employees').doc(employeeId).update({
        workSchedule,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return true;
    } catch (error) {
      console.error('Error updating work schedule:', error);
      throw error;
    }
  }

  // Update employee access code
  async updateEmployeeAccessCode(email, accessCode) {
    try {
      const employee = await this.getEmployeeByEmail(email);

      if (!employee) {
        throw new Error('Employee not found');
      }

      await db.collection('employees').doc(employee.id).update({
        accessCode,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      return true;
    } catch (error) {
      console.error('Error updating employee access code:', error);
      throw error;
    }
  }

  // Clear employee access code
  async clearEmployeeAccessCode(email) {
    try {
      const employee = await this.getEmployeeByEmail(email);

      if (!employee) {
        throw new Error('Employee not found');
      }

      await db.collection('employees').doc(employee.id).update({
        accessCode: '',
        lastLogin: admin.firestore.FieldValue.serverTimestamp()
      });

      return true;
    } catch (error) {
      console.error('Error clearing employee access code:', error);
      throw error;
    }
  }

  // Get all tasks (by employeeid)
  async getAllTasks(employeeId = null) {
    try {
      let query = db.collection('tasks')
        .where('isDeleted', '==', false)
        .orderBy('createdAt', 'desc');

      if (employeeId) {
        query = query.where('employeeId', '==', employeeId);
      }

      const snapshot = await query.get();
      const tasks = [];
      snapshot.forEach(doc => {
        tasks.push({
          id: doc.id,
          ...doc.data()
        });
      });

      return tasks;
    } catch (error) {
      console.error('Error getting all tasks:', error);
      throw error;
    }
  }

  // Get task
  async  getTask(taskId) {
    try {
      const taskRef = db.collection('tasks').doc(taskId);
      const taskDoc = await taskRef.get();
      
      if (!taskDoc.exists) {
        throw new Error('Task not found');
      }

      const taskData = taskDoc.data();
      if (taskData.isDeleted) {
        throw new Error('Task has been deleted');
      }

      return taskData;
    } catch (error) {
      console.error('Error getting task:', error);
      throw error;
    }
  }

  // Create task
  async createTask(taskData) {
      try {
        const employee = await this.getEmployee(taskData.employeeId);
        if (!employee) {
          throw new Error('Employee not found');
        }

        const requiredFields = ['title', 'assignedName', 'employeeId', 'status'];
        for (const field of requiredFields) {
          if (!taskData[field]) {
            throw new Error(`${field} is required`);
          }
        }

        const taskId = `task_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

        const newTask = {
          taskId,
          title: taskData.title,
          description: taskData.description || '',
          employeeId: taskData.employeeId,
          assignedName: taskData.assignedName,
          status: taskData.status,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          isDeleted: false,
        };

        await db.collection('tasks').doc(taskId).set(newTask);

        return taskId;
      } catch (error) {
        console.error('Error creating task:', error);
        throw error;
      }
  }

  // Update task
  async updateTask(taskId, taskData) {
    try {
      const employee = await this.getEmployee(taskData.employeeId);
      if (!employee) {
        throw new Error('Employee not found');
      }

      const requiredFields = ['title', 'assignedName', 'employeeId', 'status'];
      for (const field of requiredFields) {
        if (!taskData[field]) {
          throw new Error(`${field} is required`);
        }
      }

      const updatedTask = {
        taskId,
        title: taskData.title,
        description: taskData.description || '',
        employeeId: taskData.employeeId,
        assignedName: taskData.assignedName,
        status: taskData.status,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        isDeleted: false,
      };

      await db.collection('tasks').doc(taskId).update(updatedTask);

      return taskId;
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    }
  }

  // Delete task
  async deleteTask(taskId) {
      try {
        await db.collection('tasks').doc(taskId).update({
          isDeleted: true,
        });

        return true;
      } catch (error) {
        console.error('Error deleting task:', error);
        throw error;
      }
  }
}

module.exports = new Owner();