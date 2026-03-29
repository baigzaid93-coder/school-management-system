const express = require('express');
const router = express.Router();
const { authenticate, tenantFilter } = require('../middleware/auth');
const expenseController = require('../controllers/expenseController');

router.use(authenticate, tenantFilter());

router.get('/', expenseController.getAllExpenses);
router.get('/teachers', expenseController.getTeachers);
router.get('/staff', expenseController.getStaff);
router.get('/summary', expenseController.getExpenseSummary);
router.get('/teacher/:teacherId', expenseController.getExpensesByTeacher);
router.get('/teacher/:teacherId/summary', expenseController.getExpensesByTeacherSummary);
router.get('/staff/:staffId', expenseController.getExpensesByStaff);
router.post('/', expenseController.createExpense);
router.post('/bulk', expenseController.createBulkExpenses);
router.put('/:id', expenseController.updateExpense);
router.delete('/:id', expenseController.deleteExpense);

module.exports = router;
