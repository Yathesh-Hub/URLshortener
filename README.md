# 🚀 SnapLink - Professional URL Shortener

A full-stack URL shortener application built with modern web technologies, featuring a sleek red-and-black interface with professional design.

---

## 🏗️ **Architecture Overview**

### **System Architecture**
```
┌─────────────────────────────────────────────────────────┐
│                     Client Layer                         │
│  ┌─────────────┐  ┌─────────────┐  ┌────────────────┐  │
│  │  HTML/CSS   │  │  JavaScript │  │ LocalStorage   │  │
│  └─────────────┘  └─────────────┘  └────────────────┘  │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                    Server Layer                         │
│  ┌─────────────┐  ┌─────────────┐  ┌────────────────┐  │
│  │   Express   │  │   Routes    │  │ Middleware     │  │
│  └─────────────┘  └─────────────┘  └────────────────┘  │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                  Data Layer (Supabase)                  │
│  ┌─────────────┐  ┌─────────────┐  ┌────────────────┐  │
│  │ PostgreSQL  │  │ Row-Level   │  │ Indexed Tables │  │
│  │  Database   │  │  Security   │  │                │  │
│  └─────────────┘  └─────────────┘  └────────────────┘  │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                  External Services                      │
│  ┌─────────────┐  ┌─────────────┐                      │
│  │ QRServer    │  │ Font Services│                     │
│  │   API       │  │  (Google)    │                     │
│  └─────────────┘  └─────────────┘                      │
└─────────────────────────────────────────────────────────┘
```

---

## **Technology Stack**

### **📊 Backend Stack**
| Component | Technology | Purpose |
|-----------|------------|---------|
| **Runtime** | Node.js v24+ | JavaScript runtime environment |
| **Framework** | Express.js 4.x | Web application framework |
| **Database** | Supabase (PostgreSQL) | Cloud-hosted relational database |
| **Database Client** | @supabase/supabase-js v2.x | Supabase JavaScript client |
| **Validation** | validator v13.x | URL validation and sanitization |
| **CORS** | cors v2.x | Cross-origin resource sharing |
| **Configuration** | dotenv v16.x | Environment variable management |

### **🎨 Frontend Stack**
| Component | Technology | Purpose |
|-----------|------------|---------|
| **Markup** | HTML5 | Semantic structure |
| **Styling** | CSS3 + Custom Properties | Responsive design system |
| **JavaScript** | Vanilla ES6+ | Client-side interactivity |
| **Fonts** | Bebas Neue + JetBrains Mono | Typography system |
| **Icons** | SVG + Custom CSS | Vector graphics |
| **Animations** | CSS Keyframes | UI transitions and effects |

### **📦 Infrastructure**
| Component | Technology | Purpose |
|-----------|------------|---------|
| **Package Manager** | npm | Dependency management |
| **Development** | Node.js watch mode | Auto-reload during development |
| **Deployment** | Express static middleware | Frontend serving |
| **QR Generation** | QRServer API | External QR code service |

---

## **📁 Project Structure**

```
SnapLink/
├── 📁 public/                    # Frontend assets
│   ├── index.html              # Single-page application
│   ├── style.css               # Red/black design system
│   └── script.js               # Client-side logic
├── 📁 routes/                   # API endpoints
│   └── urlRoutes.js            # URL shortening and analytics routes
├── 📁 utils/                    # Utility functions
│   └── urlHelpers.js           # URL validation and code generation
├── 📄 .env                     # Environment configuration
├── 📄 .env.example             # Environment template
├── 📄 package.json             # Dependencies and scripts
├── 📄 server.js                # Express application server
├── 📄 db.js                    # Supabase database adapter
└── 📄 README.md                # Project documentation
```

---

## **🛢️ Database Schema (Supabase)**

### **Main Table: `urls`**
```sql
CREATE TABLE urls (
  id BIGSERIAL PRIMARY KEY,
  long_url TEXT NOT NULL UNIQUE,
  short_code VARCHAR(10) NOT NULL UNIQUE,
  clicks INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);
```

### **Indexes**
```sql
CREATE INDEX idx_urls_short_code ON urls(short_code);
CREATE INDEX idx_urls_long_url ON urls(long_url);
```

### **Security Policies**
```sql
-- Row-Level Security (RLS) Policy
CREATE POLICY "Allow public access"
ON "public"."urls"
AS PERMISSIVE
FOR ALL
TO public
USING (true)
WITH CHECK (true);
```

---

## **🔧 System Components**

### **1. Request Flow Architecture**
```
1. User submits URL → Client validation → POST /shorten
2. Backend validates → Database check → Generate unique code
3. Save to Supabase → Return short URL → Client displays result
4. Redirect request → Lookup short code → 302 redirect + increment clicks
```

### **2. Data Flow**
```
Client → Express Middleware → Route Handler → 
Supabase Query → Database Operation → 
Response Serialization → Client Rendering
```

### **3. Error Handling Strategy**
- **Client-side**: Toast notifications, form validation
- **Server-side**: HTTP status codes, JSON error responses
- **Database**: Connection retry, fallback logging
- **Network**: CORS configuration, timeout handling

---

## **⚡ Performance Optimizations**

### **Frontend**
- **Minimal Dependencies**: No framework overhead
- **CSS Custom Properties**: Efficient theming system
- **LocalStorage Caching**: Client-side history storage
- **Lazy Loading**: QR codes on-demand only

### **Backend**
- **Database Indexing**: Fast short code lookups
- **Connection Pooling**: Supabase client optimization
- **Asynchronous Operations**: Non-blocking click tracking
- **Stateless Architecture**: Horizontal scalability

### **Database**
- **Unique Constraints**: Prevent duplicate entries
- **B-tree Indexes**: O(log n) lookup performance
- **Cloud Infrastructure**: Supabase automatic scaling

---

## **🔐 Security Architecture**

### **Authentication & Authorization**
- **Public Access**: Row-Level Security policies
- **Input Validation**: Server and client-side validation
- **SQL Injection Prevention**: Supabase parameterized queries

### **Data Protection**
- **URL Sanitization**: validator library for URL safety
- **Environment Variables**: Sensitive data isolation
- **HTTPS Enforcement**: Secure API communication

### **Rate Limiting (Future)**
```javascript
// Potential implementation
app.use('/shorten', rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // 100 requests per window
}));
```

---

## **� External Integrations**

### **QR Code Generation**
- **Service**: QRServer API (free tier)
- **Integration**: Client-side image fetching
- **Parameters**: Custom size, colors, and encoding

### **Font Services**
- **Primary**: Google Fonts (Bebas Neue)
- **Monospace**: Google Fonts (JetBrains Mono)
- **Delivery**: CDN-based for performance

---

## **🚀 Deployment Considerations**

### **Development**
```bash
npm run dev  # Auto-reload with Node.js watch mode
```

### **Production**
```bash
npm start    # Standard Express server
```

### **Scaling Strategies**
1. **Horizontal Scaling**: Add more Express instances
2. **Database Scaling**: Supabase automatic scaling
3. **Caching Layer**: Redis for frequent lookups
4. **CDN Integration**: Static asset optimization

### **Monitoring**
- **Application**: Node.js process monitoring
- **Database**: Supabase dashboard metrics
- **Performance**: Response time tracking
- **Errors**: Structured logging system

---

## **📈 Scalability Features**

### **Current Capacity**
- **Short Codes**: 62^6 ≈ 56.8 billion combinations
- **Database**: Supabase auto-scaling PostgreSQL
- **Concurrency**: Stateless Express architecture

### **Future Scaling**
- **Custom Domains**: Multi-tenant support
- **API Tokens**: Rate-limited programmatic access
- **Analytics**: Advanced click tracking and reporting
- **Bulk Operations**: CSV import/export capabilities

---

## **🎯 Design Principles**

### **Architecture Decisions**
1. **Simplicity Over Complexity**: Vanilla JavaScript vs frameworks
2. **Cloud-Native Design**: Supabase for managed database
3. **Progressive Enhancement**: Works without JavaScript
4. **Mobile-First Approach**: Responsive from ground up

### **Development Philosophy**
- **Clean Separation**: MVC-inspired file structure
- **Modular Components**: Reusable utility functions
- **Consistent Styling**: CSS custom properties system
- **Accessible Design**: Semantic HTML and ARIA labels

---

## **📝 Quick Start**

```bash
# 1. Clone and install
git clone <repository>
cd SnapLink
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your Supabase credentials

# 3. Start development server
npm run dev

# 4. Access application
open http://localhost:3000
```

This architecture provides a robust foundation for a production-ready URL shortening service with clear separation of concerns, modern tooling, and scalability built into every layer.
