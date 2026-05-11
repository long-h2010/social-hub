import { Logo } from '@/components/atoms';
import { Header } from '@/components/organisms';
import { ResourceName } from '@/lib/constants';
import { ThemedLayout, ThemedSider } from '@refinedev/antd';
import { Authenticated } from '@refinedev/core';
import { Outlet, Route, Routes } from 'react-router';
import { Login } from '@/pages/login';
import { Dashboard } from '@/pages/dashboard';
import { UserCreate, UserEdit, UserList, UserShow } from '@/pages/users';
import { PostCreate, PostEdit, PostList, PostShow } from '@/pages/posts';
import { ReportEdit, ReportList, ReportShow } from '@/pages/reports';

export const AppRoutes = () => {
  return (
    <Routes>
      <Route path='/login' element={<Login />} />
      <Route
        element={
          <Authenticated redirectOnFail='/login' key={'app'}>
            <ThemedLayout
              Header={(props) => <Header {...props} />}
              Sider={(props) => (
                <ThemedSider {...props} fixed Title={() => <Logo />} />
              )}
            >
              <Outlet />
            </ThemedLayout>
          </Authenticated>
        }
      >
        <Route index element={<Dashboard />} />

        <Route path={ResourceName.USERS}>
          <Route index element={<UserList />} />
          <Route path='create' element={<UserCreate />} />
          <Route path='show/:id' element={<UserShow />} />
          <Route path='edit/:id' element={<UserEdit />} />
        </Route>

        <Route path={ResourceName.POSTS}>
          <Route index element={<PostList />} />
          <Route path='create' element={<PostCreate />} />
          <Route path='show/:id' element={<PostShow />} />
          <Route path='edit/:id' element={<PostEdit />} />
        </Route>

        <Route path={ResourceName.REPORTS}>
          <Route index element={<ReportList />} />
          <Route path='show/:id' element={<ReportShow />} />
          <Route path='edit/:id' element={<ReportEdit />} />
        </Route>
      </Route>
    </Routes>
  );
};
