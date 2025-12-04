import express from 'express';
import cors from 'cors';
import studentRoutes from './routes/students.js';
import classRoutes from './routes/classes.js';
import attendanceRoutes from './routes/attendance.js';
import authRoutes from './routes/auth.js';

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

app.get('/api', (req, res) => {
  res.json({ message: '리듬체조 출석 관리 API' });
});

app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/attendance', attendanceRoutes);

app.listen(PORT, () => {
  console.log(`서버가 포트 ${PORT}에서 실행 중입니다.`);
});
