import "./globals.css";

export const metadata = {
  title: "CourseGen",
  description: "Interactive course generator from ebooks"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="container">{children}</div>
      </body>
    </html>
  );
}
