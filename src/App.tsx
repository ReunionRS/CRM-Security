import { Redirect, Route } from 'react-router-dom';
import { IonApp, IonRouterOutlet, setupIonicReact } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import Users from './pages/Users';
import Login from './pages/Login';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import Documents from './pages/Documents';
import Calendar from './pages/Calendar';
import Reports from './pages/Reports';

import '@ionic/react/css/core.css';
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

import './theme/variables.css';
import Menu from './components/Menu';
import ProtectedRoute from './routes/ProtectedRoute';

setupIonicReact();

const App: React.FC = () => (
  <IonApp>
    <IonReactRouter>
      <Menu />
      <IonRouterOutlet id="main-content">
        <Route exact path="/login" component={Login} />
        <ProtectedRoute exact path="/projects" component={Projects} />
        <ProtectedRoute exact path="/projects/:id" component={ProjectDetail} />
        <ProtectedRoute exact path="/documents" component={Documents} />
        <ProtectedRoute
          exact
          path="/calendar"
          component={Calendar}
          allowedRoles={['admin', 'director', 'foreman', 'manager', 'accountant']}
        />
        <ProtectedRoute
          exact
          path="/reports"
          component={Reports}
          allowedRoles={['admin', 'director', 'accountant']}
        />
        <ProtectedRoute
          exact
          path="/users"
          component={Users}
          allowedRoles={['admin', 'director']}
        />
        <Route exact path="/" render={() => <Redirect to="/login" />} />
        <Route render={() => <Redirect to="/login" />} />
      </IonRouterOutlet>
    </IonReactRouter>
  </IonApp>
);

export default App;
