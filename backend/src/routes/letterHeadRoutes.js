const express = require('express');
const router = express.Router();
const letterHeadController = require('../controllers/letterHeadController');
const { authenticate, tenantFilter } = require('../middleware/auth');

router.use(authenticate, tenantFilter());

router.get('/', letterHeadController.getLetterHead);
router.post('/', letterHeadController.saveLetterHead);
router.delete('/', letterHeadController.deleteLetterHead);

module.exports = router;
