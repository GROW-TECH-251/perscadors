# Cloudinary vidéo
Définir CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY et CLOUDINARY_API_SECRET dans `.env.local` et Vercel. Les vidéos Hero et témoignages sont envoyées dans Cloudinary via une signature serveur et transcodées en MP4 H.264 (`c_transcode,f_mp4,q_auto`). Le secret Cloudinary ne doit jamais être public.
