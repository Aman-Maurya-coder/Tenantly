const express = require('express');
const { streamMediaById } = require('../controllers/mediaController');

const router = express.Router();

router.get('/:id', streamMediaById);

module.exports = router;