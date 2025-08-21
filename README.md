# Self-Claim Link

A modern Next.js application for digital product delivery through order ID claiming. Customers can claim virtual products using order IDs, while administrators manage products and orders through a comprehensive dashboard.

## 🚀 Features

### Customer Interface
- **Simple Claiming Process**: Enter order ID to claim digital products
- **Instant Download Links**: Automatic generation of secure download links
- **Multi-Product Support**: Handle multiple products per order
- **Expiration Management**: Time-limited access to prevent abuse
- **One-Time Use Control**: Configurable claim restrictions

### Admin Dashboard
- **Product Management**: Create, edit, and delete digital products
- **Order Management**: Generate orders with product assignments
- **Flexible Configuration**: Set expiration dates and usage limits
- **Secure Authentication**: JWT-based admin access
- **Real-Time Status**: Track claim counts and order status

## 🛠️ Tech Stack

- **Frontend**: Next.js 15.4.6, React 18, TypeScript
- **Styling**: Tailwind CSS with responsive design
- **Backend**: Next.js API Routes
- **Database**: SQLite with structured schema
- **Authentication**: JWT tokens with bcrypt hashing
- **Icons**: Lucide React

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/self-claim-link.git
   cd self-claim-link
   ```

2. **Install dependencies**
   ```bash
   npm install --legacy-peer-deps
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Access the application**
   - Customer interface: `http://localhost:3000`
   - Admin dashboard: `http://localhost:3000/admin`

## 🔧 Configuration

### Environment Variables
Create a `.env.local` file in the root directory:

```env
JWT_SECRET=your-super-secret-jwt-key-here
NODE_ENV=development
```

### Default Admin Account
- **Username**: `admin`
- **Password**: `password`

⚠️ **Important**: Change the default admin password in production!

## 📊 Database Schema

The application uses SQLite with the following tables:

- **`products`**: Digital products with download links
- **`orders`**: Order tracking with claim status and expiration
- **`order_products`**: Many-to-many relationship between orders and products
- **`admins`**: Admin user authentication
- **`settings`**: System configuration

## 🔐 API Endpoints

### Public Endpoints
- `POST /api/claim` - Claim products with order ID

### Admin Endpoints (Requires Authentication)
- `POST /api/auth/login` - Admin login
- `GET /api/admin/me` - Get admin info
- `GET|POST|PUT|DELETE /api/products` - Product management
- `GET|POST|PUT|DELETE /api/orders` - Order management
- `GET|PUT /api/settings` - System settings

## 🎯 Usage

### For Customers
1. Visit the main page
2. Enter your order ID in the input field
3. Click "Claim Products"
4. Download your products using the provided links

### For Administrators
1. Navigate to `/admin/login`
2. Login with admin credentials
3. Use the dashboard to:
   - Create and manage digital products
   - Generate orders with product assignments
   - Configure system settings
   - Monitor claim activity

## 🏗️ Project Structure

```
self-claim-link/
├── app/
│   ├── admin/
│   │   ├── login/
│   │   └── page.tsx          # Admin dashboard
│   ├── api/
│   │   ├── admin/
│   │   ├── auth/
│   │   ├── claim/
│   │   ├── orders/
│   │   ├── products/
│   │   └── settings/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx              # Customer interface
├── lib/
│   ├── database.ts           # Database configuration
│   └── types.ts              # TypeScript interfaces
├── package.json
└── README.md
```

## 🚀 Deployment

### Build for Production
```bash
npm run build
npm start
```

### Environment Setup
1. Set `NODE_ENV=production`
2. Configure secure `JWT_SECRET`
3. Set up proper database backup strategy
4. Configure reverse proxy (nginx/Apache)
5. Enable HTTPS in production

## 🔒 Security Considerations

- Change default admin credentials
- Use strong JWT secrets
- Implement rate limiting for production
- Regular database backups
- HTTPS enforcement
- Input validation and sanitization

## 📝 Development

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Adding New Features
1. Create API routes in `app/api/`
2. Update database schema in `lib/database.ts`
3. Add TypeScript interfaces in `lib/types.ts`
4. Implement UI components in respective pages

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/your-username/self-claim-link/issues) page
2. Create a new issue with detailed information
3. Include error messages and steps to reproduce

## 🎉 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
- Icons by [Lucide](https://lucide.dev/)
