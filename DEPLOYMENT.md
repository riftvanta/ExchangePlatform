# Deployment Guide

## Environment Variables

This application requires several environment variables to be set up for proper operation. These variables contain sensitive information and should never be committed to version control.

### Required Environment Variables

Copy the `.env.example` file to a new file named `.env` and fill in the values:

```bash
cp .env.example .env
```

Then edit the `.env` file and provide values for the following variables:

1. `DATABASE_URL` - PostgreSQL connection string in the format: 
   `postgresql://username:password@host:port/database?sslmode=require`

2. `SESSION_SECRET` - A random string used for securing session cookies. Generate a strong random string.

3. `SENDGRID_API_KEY` - Your SendGrid API key for email functionality.

4. `FROM_EMAIL` - The email address used as the sender for application emails.

5. `AWS_ACCESS_KEY_ID` - Your AWS access key ID for S3 bucket access.

6. `AWS_SECRET_ACCESS_KEY` - Your AWS secret access key for S3 bucket access.

7. `AWS_S3_BUCKET` - The name of your S3 bucket for file storage.

8. `AWS_REGION` - The AWS region where your S3 bucket is located.

### Security Best Practices

1. **Never commit the `.env` file to version control**
2. Use different credentials for development, staging, and production environments
3. Regularly rotate your credentials (especially API keys and AWS credentials)
4. Consider using a secrets management service for production deployments

### Setting Environment Variables in Production

For production deployments, it's recommended to set environment variables at the platform/infrastructure level rather than using a `.env` file:

- **Heroku:** Use the Heroku Dashboard or CLI to set config vars
- **AWS:** Use AWS Parameter Store or Secrets Manager
- **Docker:** Pass environment variables in your docker-compose file or at runtime
- **Kubernetes:** Use Kubernetes Secrets

## Database Setup

The application uses PostgreSQL with Drizzle ORM. After setting up your environment variables:

1. Run migrations to set up the database schema:
   ```
   npm run db:push
   ```

## Starting the Application

After setting up environment variables and the database:

1. Install dependencies:
   ```
   npm install
   ```

2. Start the development server:
   ```
   npm run dev
   ```

The application should now be running with the configured environment variables. 