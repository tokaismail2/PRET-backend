# Postman Collection for Recycle Backend API

This directory contains Postman collection and environment files for testing the Recycle Backend API.

## Files

- `Recycle-Backend.postman_collection.json` - Complete API collection with all endpoints
- `Recycle-Backend.postman_environment.json` - Environment variables for local development

## Setup Instructions

### 1. Import Collection

1. Open Postman
2. Click **Import** button (top left)
3. Select `Recycle-Backend.postman_collection.json`
4. The collection will appear in your Postman workspace

### 2. Import Environment

1. Click **Environments** in the left sidebar
2. Click **Import**
3. Select `Recycle-Backend.postman_environment.json`
4. Select the environment from the dropdown (top right)

### 3. Configure Base URL

The default base URL is set to `http://localhost:5000`. To change it:

1. Select the environment from the dropdown
2. Click the eye icon to view/edit variables
3. Update `baseUrl` if your server runs on a different port or host

## Collection Structure

### Authentication
- **Register** - Create a new user account
- **Login with Email** - Login using email and password (automatically saves token)
- **Login with Phone** - Login using phone and password (automatically saves token)
- **Google Signup** - Sign up with Google account
- **Forget Password** - Request password reset
- **Verify Reset Code** - Verify password reset code
- **Reset Password** - Reset password with code
- **Verify Email** - Verify email address
- **Verify Phone** - Verify phone number

### Orders
- **Create Order** - Create a new recycling order (supports file uploads)
- **Get My Orders** - Get all orders for authenticated user
- **Get Order by ID** - Get specific order details

### Donations
- **Create Donation** - Create a new food donation (supports file uploads)
- **Get My Donations** - Get all donations for authenticated user
- **Get Donation by ID** - Get specific donation details

### Dashboard
- **Get Home Dashboard** - Get dashboard statistics and data for generator user

### Personal Information
- **Update Location** - Update user location coordinates
- **Upload Logo** - Upload generator logo

## Usage Tips

### Authentication Flow

1. First, **Register** a new user or use **Login with Email/Phone**
2. The login requests automatically save the `authToken` to the environment
3. All protected endpoints will use this token automatically

### Creating Orders/Donations

When creating orders or donations with file uploads:

1. Select the request (e.g., "Create Order")
2. In the **Body** tab, select **form-data**
3. Fill in the text fields
4. For `pickupLocation`, provide a JSON string:
   ```json
   {
     "street": "123 main street",
     "city": "Cairo",
     "country": "Egypt",
     "coordinates": {
       "latitude": 30.0444,
       "longitude": 31.2357
     }
   }
   ```
5. For `photos`, click **Select Files** and choose up to 3 image files

### Material Types for Orders

Valid material types:
- `plastic`
- `paper`
- `metal`
- `glass`
- `electronics`
- `organic` (for cooking oil)
- `textiles`
- `other`

### User Roles

Valid roles:
- `generator` - Can create orders and donations
- `factory` - Can accept orders
- `admin` - Full access

### Generator Types

Valid generator types (for generators only):
- `hotel`
- `restaurant`
- `cafe`
- `office`
- `residential`
- `warehouse`
- `other`

## Testing Workflow

### Complete Flow Example

1. **Register/Login**
   - Use "Register" to create a new generator account
   - Or use "Login with Email" if account exists

2. **Update Location** (Optional)
   - Update your location coordinates

3. **Create Order**
   - Create a recycling order with photos
   - Note the order ID from response

4. **Create Donation**
   - Create a food donation with photos
   - Note the donation ID from response

5. **View Dashboard**
   - Get home dashboard to see statistics

6. **View Orders/Donations**
   - Get all your orders or donations
   - Get specific order/donation by ID

## Environment Variables

The collection uses these variables:

- `baseUrl` - API base URL (default: http://localhost:5000)
- `authToken` - JWT token (auto-populated after login)
- `userId` - User ID (optional, for reference)
- `orderId` - Order ID (optional, for testing specific orders)
- `donationId` - Donation ID (optional, for testing specific donations)

## Notes

- All protected endpoints require the `Authorization: Bearer <token>` header
- File uploads are limited to 3 photos per order/donation
- Maximum file size is 10MB per image
- Supported image formats: JPG, PNG
- The login requests include test scripts that automatically save the token

## Troubleshooting

### Token Not Working
- Make sure you've logged in first
- Check that the environment is selected
- Verify the token is saved in the environment variables

### File Upload Issues
- Ensure files are JPG or PNG format
- Check file size is under 10MB
- Make sure you're using `form-data` mode, not `raw` JSON

### CORS Issues
- If testing from a browser, ensure CORS is enabled on the server
- For Postman, CORS shouldn't be an issue

## API Base URL

Default: `http://localhost:5000`

To change the port, update the `PORT` environment variable in your `.env` file or modify the `baseUrl` in the Postman environment.


