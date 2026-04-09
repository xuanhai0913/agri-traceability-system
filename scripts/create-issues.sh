#!/bin/bash
# Create GitHub milestones, labels, and issues for the 9-week plan

REPO="xuanhai0913/agri-traceability-system"

echo "Creating milestones..."
for i in $(seq 1 9); do
  gh api repos/$REPO/milestones -f title="Tuan $i" -f state="open" -f description="Tuan $i - Ke hoach phan cong" 2>/dev/null
  echo "  Milestone: Tuan $i"
done

echo ""
echo "Creating labels..."
gh label create "smart-contract" --color "363636" --description "Solidity / Hardhat" -R $REPO 2>/dev/null
gh label create "backend" --color "339933" --description "Node.js / Express / ethers.js" -R $REPO 2>/dev/null
gh label create "frontend-web" --color "61DAFB" --description "React / Vite / Tailwind" -R $REPO 2>/dev/null
gh label create "mobile-app" --color "000020" --description "Expo / React Native" -R $REPO 2>/dev/null
gh label create "design" --color "D93F0B" --description "UML / UI-UX / Architecture" -R $REPO 2>/dev/null
gh label create "integration" --color "7B3FE4" --description "System integration" -R $REPO 2>/dev/null
gh label create "testing" --color "FBCA04" --description "QA / Bug fix / Testing" -R $REPO 2>/dev/null
gh label create "report" --color "0E8A16" --description "Documentation / Report" -R $REPO 2>/dev/null
gh label create "presentation" --color "1D76DB" --description "Slide / Demo preparation" -R $REPO 2>/dev/null
gh label create "xuan-hai" --color "C5DEF5" --description "Assigned to Xuan Hai" -R $REPO 2>/dev/null
gh label create "gia-huy" --color "FEF2C0" --description "Assigned to Gia Huy" -R $REPO 2>/dev/null
echo "Labels created."

echo ""
echo "Creating issues..."

# Helper function
create_issue() {
  local title="$1"
  local body="$2"
  local labels="$3"
  local milestone="$4"

  gh issue create \
    --repo "$REPO" \
    --title "$title" \
    --body "$body" \
    --label "$labels" \
    --milestone "$milestone"

  echo "  Created: $title"
}

# --- TUAN 1 ---

create_issue \
  "[Tuan 1] Phan tich yeu cau & Thiet ke kien truc Web" \
  "## Nguoi thuc hien
Xuan Hai

## Muc tieu
Phan tich yeu cau va thiet ke kien truc Web Admin.

## Cong viec cu the
- Khao sat tai lieu Blockchain
- Ve so do kien truc he thong tong the
- Ve Usecase Diagram cho luong Web Admin

## Deliverables
- File thiet ke UML (Usecase, Architecture) cho Web hoan thien" \
  "design,xuan-hai" \
  "Tuan 1"

create_issue \
  "[Tuan 1] Phan tich yeu cau & Thiet ke UI/UX Mobile" \
  "## Nguoi thuc hien
Gia Huy

## Muc tieu
Phan tich yeu cau va thiet ke UI/UX Mobile App.

## Cong viec cu the
- Khao sat tai lieu truy xuat nguon goc
- Thiet ke luong quet QR va UI/UX (man hinh Home, Timeline) tren Figma

## Deliverables
- Ban thiet ke UI/UX (Figma) va Usecase Diagram cho Mobile" \
  "design,mobile-app,gia-huy" \
  "Tuan 1"

# --- TUAN 2 ---

create_issue \
  "[Tuan 2] Viet Smart Contract (Solidity)" \
  "## Nguoi thuc hien
Xuan Hai

## Muc tieu
Code cac ham logic cua Smart Contract.

## Cong viec cu the
- Code ham tao lo hang moi (createBatch)
- Code ham cap nhat giai doan sinh truong (addStage)
- Cau hinh bien luu URL anh tu Cloudinary

## Deliverables
- Contract compile thanh cong va test pass tren Remix IDE" \
  "smart-contract,xuan-hai" \
  "Tuan 2"

create_issue \
  "[Tuan 2] Khoi tao Mobile Project & Dung UI tinh" \
  "## Nguoi thuc hien
Gia Huy

## Muc tieu
Khoi tao du an Mobile va code layout tinh theo thiet ke.

## Cong viec cu the
- Khoi tao du an Mobile (React Native/Expo)
- Code layout tinh bam sat ban thiet ke Figma (Home, Timeline)

## Deliverables
- App chay duoc tren may ao/that, chuyen trang muot ma" \
  "mobile-app,gia-huy" \
  "Tuan 2"

# --- TUAN 3 ---

create_issue \
  "[Tuan 3] Deploy Testnet & Khoi tao Node.js Backend" \
  "## Nguoi thuc hien
Xuan Hai

## Muc tieu
Deploy Smart Contract len testnet va khoi tao Backend.

## Cong viec cu the
- Deploy Smart Contract len Polygon Amoy / Ethereum Sepolia
- Khoi tao Node.js, dung Ethers.js ket noi toi Contract

## Deliverables
- API Backend goi duoc ham tu Smart Contract tren Testnet" \
  "backend,smart-contract,xuan-hai" \
  "Tuan 3"

create_issue \
  "[Tuan 3] Tich hop Camera quet ma QR" \
  "## Nguoi thuc hien
Gia Huy

## Muc tieu
Tich hop thu vien quet ma QR vao Mobile App.

## Cong viec cu the
- Tim va tich hop thu vien quet ma QR (expo-camera)
- Viet logic xin quyen Camera va trich xuat chuoi ID tu QR code

## Deliverables
- App mo duoc Camera va log ra duoc ID sau khi quet" \
  "mobile-app,gia-huy" \
  "Tuan 3"

# --- TUAN 4 ---

create_issue \
  "[Tuan 4] Code UI Web Admin & Upload Cloudinary" \
  "## Nguoi thuc hien
Xuan Hai

## Muc tieu
Dung form nhap lieu va tich hop upload anh.

## Cong viec cu the
- Dung form nhap lieu tao lo hang bang ReactJS
- Tich hop API Cloudinary de xu ly upload anh tu may tinh

## Deliverables
- Form chay on dinh. Anh up thanh cong len Cloudinary va tra ve URL" \
  "frontend-web,xuan-hai" \
  "Tuan 4"

create_issue \
  "[Tuan 4] Hoan thien UI Timeline & Load anh Cloudinary" \
  "## Nguoi thuc hien
Gia Huy

## Muc tieu
Hoan thien Timeline va hien thi anh tu Cloudinary.

## Cong viec cu the
- Tich hop thu vien do thi/danh sach de lam Timeline
- Code logic load hien thi anh nong san dua tren URL Cloudinary

## Deliverables
- Timeline hien thi dep, anh render tot khong bi vo hoac loi CORS" \
  "mobile-app,gia-huy" \
  "Tuan 4"

# --- TUAN 5 ---

create_issue \
  "[Tuan 5] Ghep noi Web - Node.js - SC & Sinh ma QR" \
  "## Nguoi thuc hien
Xuan Hai

## Muc tieu
Tich hop toan bo he thong Web va sinh ma QR.

## Cong viec cu the
- Gan API Backend vao Web Frontend
- Viet ham nhan ID lo hang sau khi luu Blockchain de sinh ra hinh anh ma QR (QR Generator)

## Deliverables
- Tao thanh cong 1 lo hang tu Web, du lieu len SC, Web hien thi QR" \
  "integration,frontend-web,xuan-hai" \
  "Tuan 5"

create_issue \
  "[Tuan 5] Ghep noi Mobile App voi Backend/SC" \
  "## Nguoi thuc hien
Gia Huy

## Muc tieu
Ket noi Mobile App voi Backend de hien thi du lieu tu Blockchain.

## Cong viec cu the
- Viet ham goi API Backend (hoac goi thang RPC) truyen ID quet duoc tu QR de lay data hanh trinh
- Bind data len UI Timeline

## Deliverables
- App quet QR cung -> hien ra duoc data fake/test tu Blockchain" \
  "integration,mobile-app,gia-huy" \
  "Tuan 5"

# --- TUAN 6 ---

create_issue \
  "[Tuan 6] Toi uu trai nghiem Web Admin & Xu ly vi" \
  "## Nguoi thuc hien
Xuan Hai

## Muc tieu
Fix bug va toi uu trai nghiem nguoi dung tren Web.

## Cong viec cu the
- Fix cac bug phat sinh
- Xu ly trang thai Loading khi goi lenh Blockchain
- Xu ly logic ket noi vi Metamask

## Deliverables
- Web khong co loi console, trai nghiem muot ma, ranh mach" \
  "testing,frontend-web,xuan-hai" \
  "Tuan 6"

create_issue \
  "[Tuan 6] Test thuc te luong quet QR & Toi uu Render" \
  "## Nguoi thuc hien
Gia Huy

## Muc tieu
Test thuc te va toi uu hieu nang Mobile App.

## Cong viec cu the
- Quet thu ma QR do Web cua Hai sinh ra tren man hinh may tinh
- Fix loi delay khi load data tu mang

## Deliverables
- Quet ma that sinh tu Web hien dung 100% thong tin lo hang tuong ung" \
  "testing,mobile-app,gia-huy" \
  "Tuan 6"

# --- TUAN 7 ---

create_issue \
  "[Tuan 7] Soan thao Chuong 1 & Chuong 2" \
  "## Nguoi thuc hien
Xuan Hai

## Muc tieu
Viet noi dung bao cao chuong 1 va 2.

## Cong viec cu the
- Viet: Loi mo dau, Tong quan he thong (C1)
- Viet: Co so ly thuyet Blockchain & Cloudinary (C2)

## Deliverables
- File Word ban nhap Chuong 1 & 2 hoan chinh" \
  "report,xuan-hai" \
  "Tuan 7"

create_issue \
  "[Tuan 7] Soan thao Chuong 3 & Chuong 4" \
  "## Nguoi thuc hien
Gia Huy

## Muc tieu
Viet noi dung bao cao chuong 3 va 4.

## Cong viec cu the
- Viet: Phan tich thiet ke he thong (C3)
- Viet: Cai dat va Kiem thu chuc nang (C4)

## Deliverables
- File Word ban nhap Chuong 3 & 4 hoan chinh" \
  "report,gia-huy" \
  "Tuan 7"

# --- TUAN 8 ---

create_issue \
  "[Tuan 8] Soat loi he thong Web & Gop Bao cao" \
  "## Nguoi thuc hien
Xuan Hai

## Muc tieu
Test toan bo Web va gop bao cao tong the.

## Cong viec cu the
- Test lai toan bo chuc nang Web
- Gop noi dung 4 Chuong, chinh sua chuan format IEEE theo mau truong quy dinh

## Deliverables
- He thong Web 100% bug-free. Bao cao tong the da duoc rap lai" \
  "testing,report,xuan-hai" \
  "Tuan 8"

create_issue \
  "[Tuan 8] Soat loi Mobile & Hieu dinh Bao cao" \
  "## Nguoi thuc hien
Gia Huy

## Muc tieu
Test Mobile App va hieu dinh bao cao.

## Cong viec cu the
- Test lai build Mobile App
- Phu trach chen hinh anh, can chinh bang bieu, kiem tra danh muc hinh anh trong Bao cao

## Deliverables
- App chay on dinh. Quyen Bao cao ban nhap hoan chinh nop GVHD" \
  "testing,report,gia-huy" \
  "Tuan 8"

# --- TUAN 9 ---

create_issue \
  "[Tuan 9] Lam Slide thuyet trinh & Chuan bi Demo Web" \
  "## Nguoi thuc hien
Xuan Hai

## Muc tieu
Chuan bi slide va demo cho buoi bao ve.

## Cong viec cu the
- Thiet ke Slide bao ve (tap trung vao kien truc va Backend)
- Chuan bi san du lieu, kich ban thao tac tao lo hang tren Web luc bao ve

## Deliverables
- Slide hoan tat. Demo muot ma khong gap su co mang" \
  "presentation,xuan-hai" \
  "Tuan 9"

create_issue \
  "[Tuan 9] Sua Bao cao & Chuan bi Demo Mobile App" \
  "## Nguoi thuc hien
Gia Huy

## Muc tieu
Hoan tat bao cao va chuan bi demo Mobile.

## Cong viec cu the
- Sua Bao cao theo gop y cua thay Tuan (neu co)
- Chuan bi may that cai san App, test dieu kien anh sang quet QR phong bao ve

## Deliverables
- In an hoan tat. San sang bao ve Khoa luan truoc Hoi dong" \
  "presentation,report,gia-huy" \
  "Tuan 9"

echo ""
echo "Done! All 18 issues created."
