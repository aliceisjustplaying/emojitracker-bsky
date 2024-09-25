interface EmojiStats {
  processedPosts: number;
  processedEmojis: number;
  postsWithEmojis: number;
  postsWithoutEmojis: number;
  ratio: string;
}

interface FooterProps {
  stats: EmojiStats;
}

function Footer({ stats }: FooterProps) {
  return (
    <footer className="w-full bg-gray-200 p-1 flex flex-row justify-end items-center">
      <span className="w-full sm:w-auto text-center px-2">Posts: {stats.processedPosts}</span>
      <span className="w-full sm:w-auto text-center px-2">Emojis: {stats.processedEmojis}</span>
      {/* <span className="w-full sm:w-auto text-center">Posts with Emojis: {stats.postsWithEmojis}</span>
        <span className="w-full sm:w-auto text-center">Posts without Emojis: {stats.postsWithoutEmojis}</span> */}
      <span className="w-full sm:w-auto text-center px-2">Ratio: {stats.ratio}</span>
    </footer>
  );
}

export default Footer;
