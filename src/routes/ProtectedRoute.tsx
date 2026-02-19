import React from 'react';
import { Redirect, Route, type RouteProps } from 'react-router-dom';
import { IonSpinner } from '@ionic/react';
import { useAuth } from '../context/AuthContext';
import type { UserRole } from '../models/Roles';

interface ProtectedRouteProps extends RouteProps {
  component: React.ComponentType<any>;
  allowedRoles?: UserRole[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  component: Component,
  allowedRoles,
  ...rest
}) => {
  const { user, role, loading } = useAuth();

  return (
    <Route
      {...rest}
      render={(props) => {
        if (loading) {
          return (
            <div className="ion-text-center ion-padding">
              <IonSpinner name="crescent" />
            </div>
          );
        }

        if (!user) {
          return <Redirect to="/login" />;
        }

        if (allowedRoles && (!role || !allowedRoles.includes(role))) {
          return <Redirect to="/projects" />;
        }

        return <Component {...props} />;
      }}
    />
  );
};

export default ProtectedRoute;

