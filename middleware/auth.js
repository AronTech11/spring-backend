import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config.js';

export const requireSignin = (req, res, next) => {
  try {
    const token = req.headers.authorization;

    if (!token) {
      console.error('Authorization token is missing');
      return res.status(401).json({ error: 'Authorization token is missing' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      console.error('Invalid token signature');
      return res.status(401).json({ error: 'Invalid token signature' });
    }
    console.log(err);
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};
