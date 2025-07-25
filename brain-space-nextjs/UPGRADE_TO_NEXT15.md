# Upgrading to Next.js 15 and React 19

If you want to try the latest versions again, here's how to upgrade:

## 1. Update package.json

```json
{
  "dependencies": {
    "next": "15.1.0",
    "react": "19.0.0",
    "react-dom": "19.0.0",
    // ... other deps
  },
  "devDependencies": {
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "eslint-config-next": "15.1.0",
    // ... other dev deps
  }
}
```

## 2. Update scripts for Turbopack (optional but recommended)

```json
{
  "scripts": {
    "dev": "next dev --turbopack",
    // ... other scripts
  }
}
```

## 3. Rename config file back to TypeScript

```bash
mv next.config.js next.config.ts
```

Then update the file to use TypeScript syntax:
```typescript
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // your config
}

export default nextConfig
```

## 4. Install and rebuild

```bash
rm -rf node_modules pnpm-lock.yaml
pnpm install
pnpm run build
```

## Known Issues with Next.js 15 on Vercel

The client-reference-manifest.js error you encountered seems to be related to:
- Route groups with parentheses `(dashboard)` 
- Next.js 15's new build output structure
- Vercel's file system handling

## Potential Solutions for Next.js 15 Deployment

1. **Use Vercel's latest Node.js runtime**:
   - Update `.nvmrc` to `20.x` or `22.x`
   
2. **Try the App Router without route groups**:
   - Rename `(dashboard)` to `dashboard` (no parentheses)
   - Update all route references

3. **Enable experimental features**:
   ```typescript
   const nextConfig: NextConfig = {
     experimental: {
       // Try different experimental flags if needed
     }
   }
   ```

4. **Contact Vercel Support**:
   - This might be a known issue with their build system
   - They may have specific workarounds

## Why We Downgraded

- Next.js 14.2.18 is the latest stable version that's well-tested with Vercel
- React 18.3.1 is production-ready and widely used
- The route groups feature works perfectly in Next.js 14

You can always try Next.js 15 again once Vercel fully supports it or if you find a workaround for the build issue.