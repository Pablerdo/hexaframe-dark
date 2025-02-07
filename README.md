Hexaframe is a tool that implements [`Go-with-the-Flow`](https://eyeline-research.github.io/Go-with-the-Flow/) with the help of object segmentation from [SAMv2](https://github.com/facebookresearch/sam2), in order to generate videos from video, coordinate path, and text prompts. It is built with Next.js, Shadcn, and Tailwind, with a simple UI and is hosted on Vercel. 

The project follows the following steps:

1. The user uploads an image.

2. The user clicks on the object they want to move, which sends a request to a ComfyDeploy server that implements SAMv2 on a ComfyUI workflow that segments the image. 

3. The segmented image is shown to the user, which allows him to grab the segmented object and drag it through the desired path. The coordinate path is computed.

4. The user inputs a text prompt.

5. All the inputs are sent to a second ComfyDeploy server that implements Go-with-the-Flow on a ComfyUI workflow that generates the video.

6. The video is shown to the user.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

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
