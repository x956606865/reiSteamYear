This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting

### Configuration

1.  **Steam API Key**:
    -   Go to [Steam Web API Key](https://steamcommunity.com/dev/apikey)
    -   Domain Name: `localhost` (or your domain)
    -   Copy the Key.

2.  **Environment Variables**:
    Create `.env.local` in the root:
    ```env
    # Steam Web API Key
    STEAM_CLIENT_SECRET=AddYourKeyHere

    # Random string for encryption
    NEXTAUTH_SECRET=run_openssl_rand_base64_32

    # App URL (default for dev)
    NEXTAUTH_URL=http://localhost:3000

    # (Optional) Proxy for Steam API Access (Common in CN)
    # HTTPS_PROXY=http://127.0.0.1:7890
    # HTTP_PROXY=http://127.0.0.1:7890
    ```

### Running the App

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Features Guide
-   **Login**: Use the specific button in header.
-   **Dashboard**: View games played in the last year (365 days).
-   **Review**: Click "Review" on any game to set a rating, status, and comment.
-   **Summary**: Click "View Summary" to generate an infographic and download it.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
