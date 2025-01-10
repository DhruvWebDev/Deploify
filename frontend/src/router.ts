import { createBrowserRouter } from "react-router-dom";
import Home from './page/home';
import About from './page/about';
import Pricing from './page/pricing';
import Dashboard from './page/dashboard';
import AppLayout from "./Layout/app-layout";

const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      {
        path: '/',
        element: <Home />,
      },
      {
        path: '/about',
        element: <About />,
      },
      {
        path: '/pricing',
        element: <Pricing />,
      },
      {
        path: '/dashboard',
        element: <Dashboard />,
      },
    ],
  },
]);

export default router;
