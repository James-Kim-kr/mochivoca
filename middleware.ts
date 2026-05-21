import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login",
  },
});

export const config = {
  matcher: [
    "/",
    "/onboarding",
    "/study",
    "/done",
    "/me",
    "/settings",
    "/challenge/:path*",
    "/scrap/:path*",
    "/quiz",
    "/league",
  ],
};
