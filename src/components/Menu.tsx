import {
    IonContent,
    IonHeader,
    IonIcon,
    IonItem,
    IonItemDivider,
    IonItemGroup,
    IonLabel,
    IonMenu,
    IonMenuToggle,
    IonRouterLink,
    IonTitle,
    IonToolbar
} from "@ionic/react";
import {
    chevronDownOutline,
    chevronDownSharp, cubeOutline, cubeSharp,
    documentTextOutline, documentTextSharp, logOutOutline, navigate,
    peopleCircleOutline,
    wifiOutline
} from "ionicons/icons";

import React, {useState} from "react";
import {getAuth, signOut} from "firebase/auth";

const Menu: React.FC = () => {

    interface HideSubMenu {
        [key: string]: boolean;
    }

    const [subMenu, setSubMenu] = useState<HideSubMenu>({});

    const toggleSubMenu = (sport: string) => {
        setSubMenu((value) => {
            return {...value, [sport]: !value[sport]};
        });
    }

    const auth = getAuth()
    async function handleSignOut(){
        try {
            await signOut(auth);
        } catch (error) {
            console.log(error)
        }
    }

    return (
        <IonMenu side="start" contentId="main-content">
            <IonHeader>
                <IonToolbar>
                    <IonTitle>CRM-Menu</IonTitle>
                    <IonMenu menuId="find-events-menu" side="start" contentId="main-content">
                    </IonMenu>
                </IonToolbar>
            </IonHeader>
            <IonContent className="ion-no-padding">
                <IonItemGroup>
                    <IonItemDivider onClick={() => toggleSubMenu('Control')}>
                        <IonLabel>Управление оборудование</IonLabel>
                        <IonIcon slot="end" color="medium" ios={chevronDownOutline} md={chevronDownSharp}/>
                    </IonItemDivider>
                    <IonMenuToggle hidden={subMenu.Control} autoHide={false}>
                        <IonRouterLink href="/forms">
                            <IonItem lines="full" detail={true}>
                                <IonIcon slot="start" ios={documentTextOutline} md={documentTextSharp}/>
                                <IonLabel>Анкеты</IonLabel>
                            </IonItem>
                        </IonRouterLink>
                    </IonMenuToggle>
                    <IonMenuToggle hidden={subMenu.Control} autoHide={false}>
                        <IonRouterLink href="/monitoring">
                            <IonItem lines="full" detail={true}>
                                <IonIcon slot="start" ios={cubeOutline} md={cubeSharp}/>
                                <IonLabel>Объекты</IonLabel>
                            </IonItem>
                        </IonRouterLink>
                    </IonMenuToggle>
                </IonItemGroup>
                <IonItemGroup>
                    <IonItemDivider onClick={() => toggleSubMenu('Users')}>
                        <IonLabel>Управление Пользователями</IonLabel>
                        <IonIcon slot="end" color="medium" ios={chevronDownOutline} md={chevronDownSharp}/>
                    </IonItemDivider>
                    <IonMenuToggle hidden={subMenu.Users} autoHide={false}>
                        <IonRouterLink href="/users">
                            <IonItem lines="full" detail={true}>
                                <IonIcon slot="start" ios={peopleCircleOutline} md={peopleCircleOutline}/>
                                <IonLabel>Пользователи</IonLabel>
                            </IonItem>
                        </IonRouterLink>
                    </IonMenuToggle>
                </IonItemGroup>
            </IonContent>
        </IonMenu>
    );
};

export default Menu;
