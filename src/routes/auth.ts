import { Router } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

const router = Router();

router.post('/login', (req, res) => {
  const { name, type } = req.body;
  if (!name || !type) return res.status(400).json({ message: 'Name and type required' });

  const token = jwt.sign({ name, type }, process.env.JWT_SECRET!, { expiresIn: '12h' });
  res.json({ token });
});

export default router;
