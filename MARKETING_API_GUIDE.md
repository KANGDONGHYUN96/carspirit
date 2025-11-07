# 카스피릿 문의 접수 API 연동 가이드 (마케팅 업체용)

## 🔐 보안 안내

**절대 외부에 노출하면 안 되는 정보:**
- API Key: `test_api_key_12345` (테스트용)
- 실제 운영 시 별도로 발급된 API Key 사용

**안전한 점:**
- API Key만 있으면 문의 접수만 가능
- 데이터베이스 직접 접근 불가
- 기존 데이터 조회/수정/삭제 불가
- 오직 새로운 문의 추가만 가능

---

## 📌 API 기본 정보

### 엔드포인트
```
POST https://carspirit.vercel.app/api/inquiry/create
```

### 인증 방식
HTTP 헤더에 API Key 포함

### 요청 형식
```http
POST /api/inquiry/create HTTP/1.1
Host: carspirit.vercel.app
Content-Type: application/json
X-API-Key: test_api_key_12345

{
  "customer_name": "홍길동",
  "customer_phone": "010-1234-5678",
  "content": "현대 아이오닉5 장기렌트 견적 문의드립니다",
  "source": "네이버"
}
```

### 응답 형식

**성공 시 (200 OK):**
```json
{
  "success": true,
  "inquiry_id": "uuid-here",
  "assigned_to": "담당자 이름"
}
```

**실패 시 (400/401/500):**
```json
{
  "error": "오류 메시지"
}
```

---

## 💻 연동 방법

### 방법 1: HTML + JavaScript (가장 쉬움)

```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <title>차량 견적 문의</title>
</head>
<body>
  <form id="inquiryForm">
    <input type="text" id="name" placeholder="이름" required>
    <input type="tel" id="phone" placeholder="010-1234-5678" required>
    <textarea id="content" placeholder="문의 내용" required></textarea>
    <button type="submit">문의하기</button>
  </form>

  <script>
    document.getElementById('inquiryForm').addEventListener('submit', async (e) => {
      e.preventDefault()

      const button = e.target.querySelector('button')
      button.disabled = true
      button.textContent = '전송 중...'

      try {
        const response = await fetch('https://carspirit.vercel.app/api/inquiry/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': 'test_api_key_12345' // ⚠️ 실제 키로 교체
          },
          body: JSON.stringify({
            customer_name: document.getElementById('name').value,
            customer_phone: document.getElementById('phone').value,
            content: document.getElementById('content').value,
            source: '네이버' // 또는 '카카오', '페이스북' 등
          })
        })

        const result = await response.json()

        if (response.ok) {
          alert('문의가 접수되었습니다! 곧 연락드립니다.')
          e.target.reset()
        } else {
          alert('오류: ' + result.error)
        }
      } catch (error) {
        alert('네트워크 오류가 발생했습니다.')
      } finally {
        button.disabled = false
        button.textContent = '문의하기'
      }
    })
  </script>
</body>
</html>
```

---

### 방법 2: jQuery 사용

```javascript
$('#inquiryForm').on('submit', function(e) {
  e.preventDefault()

  $.ajax({
    url: 'https://carspirit.vercel.app/api/inquiry/create',
    type: 'POST',
    headers: {
      'X-API-Key': 'test_api_key_12345' // ⚠️ 실제 키로 교체
    },
    contentType: 'application/json',
    data: JSON.stringify({
      customer_name: $('#name').val(),
      customer_phone: $('#phone').val(),
      content: $('#content').val(),
      source: '네이버'
    }),
    success: function(response) {
      alert('문의가 접수되었습니다!')
      $('#inquiryForm')[0].reset()
    },
    error: function(xhr) {
      alert('오류: ' + xhr.responseJSON.error)
    }
  })
})
```

---

### 방법 3: React 사용

```jsx
import { useState } from 'react'

function InquiryForm() {
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_phone: '',
    content: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch('https://carspirit.vercel.app/api/inquiry/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': 'test_api_key_12345' // ⚠️ 실제 키로 교체
        },
        body: JSON.stringify({
          ...formData,
          source: '네이버'
        })
      })

      const result = await response.json()

      if (response.ok) {
        alert('문의가 접수되었습니다!')
        setFormData({ customer_name: '', customer_phone: '', content: '' })
      } else {
        alert('오류: ' + result.error)
      }
    } catch (error) {
      alert('네트워크 오류가 발생했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={formData.customer_name}
        onChange={(e) => setFormData({...formData, customer_name: e.target.value})}
        placeholder="이름"
        required
      />
      <input
        type="tel"
        value={formData.customer_phone}
        onChange={(e) => setFormData({...formData, customer_phone: e.target.value})}
        placeholder="010-1234-5678"
        required
      />
      <textarea
        value={formData.content}
        onChange={(e) => setFormData({...formData, content: e.target.value})}
        placeholder="문의 내용"
        required
      />
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? '전송 중...' : '문의하기'}
      </button>
    </form>
  )
}
```

---

### 방법 4: PHP 사용

```php
<?php
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = [
        'customer_name' => $_POST['name'],
        'customer_phone' => $_POST['phone'],
        'content' => $_POST['content'],
        'source' => '네이버'
    ];

    $ch = curl_init('https://carspirit.vercel.app/api/inquiry/create');
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'X-API-Key: test_api_key_12345' // ⚠️ 실제 키로 교체
    ]);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode === 200) {
        echo '문의가 접수되었습니다!';
    } else {
        echo '오류가 발생했습니다.';
    }
}
?>
```

---

## 📋 필수 필드

| 필드 | 타입 | 필수 | 설명 | 예시 |
|------|------|------|------|------|
| `customer_name` | string | ✅ | 고객 이름 | "홍길동" |
| `customer_phone` | string | ✅ | 연락처 | "010-1234-5678" |
| `content` | string | ✅ | 문의 내용 | "아이오닉5 견적 문의" |
| `source` | string | ❌ | 유입 경로 | "네이버", "카카오", "페이스북" |

---

## ⚠️ 주의사항

1. **API Key 보안**
   - API Key는 절대 GitHub, 블로그 등 공개된 곳에 올리지 마세요
   - 서버 측 코드에서 사용하거나, 환경 변수로 관리하세요

2. **전화번호 형식**
   - `010-1234-5678` 또는 `01012345678` 형식 권장
   - 자동으로 하이픈이 추가됩니다

3. **요청 제한**
   - 동일 IP에서 1분에 10회 이상 요청 시 차단될 수 있습니다
   - 정상적인 사용에는 영향 없습니다

4. **응답 처리**
   - HTTP 상태 코드를 확인하세요 (200 = 성공)
   - 실패 시 `error` 필드에 오류 메시지가 포함됩니다

---

## 🧪 테스트 방법

### cURL로 테스트:
```bash
curl -X POST https://carspirit.vercel.app/api/inquiry/create \
  -H "Content-Type: application/json" \
  -H "X-API-Key: test_api_key_12345" \
  -d '{
    "customer_name": "테스트",
    "customer_phone": "010-1234-5678",
    "content": "테스트 문의입니다",
    "source": "테스트"
  }'
```

### Postman으로 테스트:
1. Method: `POST`
2. URL: `https://carspirit.vercel.app/api/inquiry/create`
3. Headers:
   - `Content-Type`: `application/json`
   - `X-API-Key`: `test_api_key_12345`
4. Body (raw JSON):
```json
{
  "customer_name": "테스트",
  "customer_phone": "010-1234-5678",
  "content": "테스트 문의입니다",
  "source": "테스트"
}
```

---

## 🆘 문제 해결

### 401 Unauthorized 오류
- API Key가 잘못되었습니다
- 헤더에 `X-API-Key`가 포함되었는지 확인하세요

### 400 Bad Request 오류
- 필수 필드가 누락되었습니다
- `customer_name`, `customer_phone`, `content`를 모두 포함했는지 확인하세요

### CORS 오류
- 브라우저에서 직접 호출할 때는 CORS 문제가 발생하지 않습니다
- 만약 발생한다면 연락 주세요

---

## 📞 문의

API 연동 중 문제가 발생하면 연락 주세요:
- 이메일: support@carspirit.com
- 전화: 010-XXXX-XXXX

---

## 📝 변경 이력

- 2025-01-XX: 초기 버전 작성
- API Key 인증 추가
- 테스트 환경 구축
