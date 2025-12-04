# Render 배포 설정 가이드

## 1. PostgreSQL 데이터베이스 생성

Render 대시보드에서:
1. **Dashboard** → **New** → **PostgreSQL** 클릭
2. 다음 설정으로 데이터베이스 생성:
   - **Name**: `rg-manager-db` (원하는 이름)
   - **Database**: `rg_manager`
   - **User**: `rg_manager_user`
   - **Region**: Singapore (또는 가까운 지역)
   - **PostgreSQL Version**: 최신 버전 (15 이상 권장)
   - **Plan**: Free

3. 생성 완료 후 **Internal Database URL** 복사
   - 형식: `postgresql://username:password@hostname/database`

## 2. Web Service 생성

1. **New** → **Web Service** 클릭
2. GitHub 저장소 연결: `jwchoi684/rg-manager`
3. 다음 설정 입력:

### Basic Settings
- **Name**: `rg-manager` (원하는 이름)
- **Region**: Singapore (또는 데이터베이스와 동일한 지역)
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
- **Key**: `DATABASE_URL`
- **Value**: (위에서 복사한 Internal Database URL 붙여넣기)
  - 예: `postgresql://rg_manager_user:password@hostname/rg_manager`

- **Key**: `NODE_ENV`
- **Value**: `production`

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
- ✅ PostgreSQL 데이터베이스 사용으로 데이터가 영구적으로 저장됩니다
- ✅ 재배포 시에도 데이터가 유지됩니다
- ⚠️ 무료 플랜은 비활성 시 서비스가 중지될 수 있습니다 (데이터는 유지)

### 무료 플랜 제한
- Web Service: 750시간/월 무료
- 15분 동안 요청이 없으면 슬립 모드 (첫 요청 시 재시작)
- PostgreSQL: Free plan 사용 가능 (제한 있음)

### 문제 해결
배포 후 문제가 발생한다면:

1. **Render Dashboard → Service → Logs** 탭 확인
   - 데이터베이스 연결 메시지 확인
   - "데이터베이스 초기화 완료" 메시지 확인

2. **Environment** 탭 확인
   - `DATABASE_URL` 올바르게 설정되었는지 확인
   - `NODE_ENV=production` 설정 확인

3. **데이터베이스 연결 확인**
   - PostgreSQL 대시보드에서 **Connect** 탭 확인
   - Internal Database URL이 올바른지 확인

4. **재배포**
   - Manual Deploy 버튼 클릭하여 재배포

## 로컬 개발 환경

로컬에서 PostgreSQL을 사용하려면:

1. PostgreSQL 설치 (macOS: `brew install postgresql`)
2. 데이터베이스 생성:
   ```bash
   createdb rg_manager
   ```
3. 환경 변수 설정 (`.env` 파일):
   ```
   DATABASE_URL=postgresql://localhost/rg_manager
   ```

또는 기본값으로 Render의 데이터베이스 URL이 사용됩니다.
