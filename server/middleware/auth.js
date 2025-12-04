import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ error: '토큰이 제공되지 않았습니다.', tokenExpired: true });
    }

    const token = authHeader.startsWith('Bearer ')
      ? authHeader.substring(7)
      : authHeader;

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) {
        if (err.name === 'TokenExpiredError') {
          return res.status(401).json({ error: '토큰이 만료되었습니다.', tokenExpired: true });
        }
        return res.status(401).json({ error: '유효하지 않은 토큰입니다.', tokenExpired: true });
      }

      req.user = decoded;
      next();
    });
  } catch (error) {
    return res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
};
