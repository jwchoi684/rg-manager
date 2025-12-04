# Render 배포 설정 가이드

## 1. Persistent Disk 생성

Render 대시보드에서:
1. **Dashboard** → **Disks** → **New Disk** 클릭
2. 다음 설정으로 디스크 생성:
   - **Name**: `attendance-db-disk`
   - **Size**: 1 GB (무료)
   - **Mount Path**: `/var/data`

## 2. Web Service 생성

1. **New** → **Web Service** 클릭
2. GitHub 저장소 연결: `jwchoi684/rg-manager`
3. 다음 설정 입력:

### Basic Settings
- **Name**: `rg-manager` (원하는 이름)
- **Region**: Singapore (또는 가까운 지역)
- **Branch**: `main`
- **Root Directory**: (비워두기)
- **Runtime**: Node
- **Build Command**:
  ```bash
  cd client && rm -rf node_modules package-lock.json && npm install && npm run build && cd ../server && npm install
  ```
- **Start Command**:
  ```bash
  cd server && node server.js
  ```

### Environment Variables
**Environment** 탭에서 환경 변수 추가:
- **Key**: `DATABASE_PATH`
- **Value**: `/var/data/attendance.db`

### Disk 연결
**Disk** 탭에서:
1. **Add Disk** 클릭
2. 위에서 생성한 `attendance-db-disk` 선택
3. **Mount Path**: `/var/data` (디스크 생성 시 설정한 경로와 동일)

## 3. 배포

**Create Web Service** 버튼 클릭하여 배포 시작

## 4. 확인

배포 완료 후:
1. Render가 제공하는 URL로 접속
2. 기본 관리자 계정으로 로그인:
   - Username: `admin`
   - Password: `admin123`

## 중요 사항

### 데이터 영속성
- ✅ Persistent Disk를 마운트하면 재배포 시에도 데이터 유지
- ✅ 환경 변수 `DATABASE_PATH`가 `/var/data/attendance.db`로 설정되어야 함
- ⚠️ 무료 플랜은 비활성 시 서비스가 중지될 수 있음 (데이터는 유지)

### 무료 플랜 제한
- 750시간/월 무료
- 15분 동안 요청이 없으면 슬립 모드 (첫 요청 시 재시작)
- Persistent Disk 1GB 무료

### 문제 해결
배포 후 데이터가 유지되지 않는다면:
1. Render Dashboard → Service → **Environment** 탭 확인
   - `DATABASE_PATH=/var/data/attendance.db` 설정 확인
2. **Disk** 탭 확인
   - Disk가 `/var/data`에 마운트되었는지 확인
3. **Logs** 탭에서 로그 확인
   - "데이터베이스 경로: /var/data/attendance.db" 메시지 확인
