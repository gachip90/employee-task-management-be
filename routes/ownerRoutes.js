const express = require('express');
const router = express.Router();
const ownerController = require('../controllers/ownerController');

router.post('/create-new-access-code', ownerController.createNewAccessCode);
router.post('/validate-access-code', ownerController.validateAccessCode);
router.get('/get-all-employees', ownerController.getAllEmployees);
router.get('/get-employee/:employeeId', ownerController.getEmployee);
router.post('/create-employee', ownerController.createEmployee);
router.put('/update-employee/:employeeId', ownerController.updateEmployee);
router.post('/delete-employee', ownerController.deleteEmployee);
router.put('/update-work-schedule/:employeeId', ownerController.updateWorkSchedule);
router.get('/get-all-tasks', ownerController.getAllTasks);
router.post('/create-task', ownerController.createTask);
router.put('/update-task/:taskId', ownerController.updateTask);
router.post('/delete-task', ownerController.deleteTask);

module.exports = router;