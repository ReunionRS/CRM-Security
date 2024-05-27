import {Redirect, Route, RouteComponentProps} from 'react-router-dom';
import {IonApp, IonRouterOutlet, setupIonicReact} from '@ionic/react';
import {IonReactRouter} from '@ionic/react-router';
import Forms from './pages/./Forms';
import Users from './pages/Users';
import Monitoring from './pages/Monitoring';

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

/* Theme variables */
import './theme/variables.css';
import Menu from "./components/Menu";
import Login from "./pages/Login";

setupIonicReact();

const App: React.FC<RouteComponentProps> = ({match}) => (
    <IonApp>
        <Menu></Menu>
        <IonReactRouter>
            <IonRouterOutlet>
                <Route exact path="/forms" component={Forms}/>
                <Route exact path="/users" component={Users}/>
                <Route exact path="/login" component={Login}/>
                <Route exact path="/monitoring" component={Monitoring}/>
                <Route render={() => <Redirect to="/login"/>}/>
            </IonRouterOutlet>
        </IonReactRouter>
    </IonApp>
);

export default App;
