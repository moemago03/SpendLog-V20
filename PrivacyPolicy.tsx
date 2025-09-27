import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton } from '@ionic/react';

interface PrivacyPolicyProps {
  onBack: () => void;
}

const PrivacyPolicy: React.FC<PrivacyPolicyProps> = ({ onBack }) => {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            {/* This button will trigger the onBack function passed from App.tsx */}
            <IonBackButton text="Back" onClick={onBack} />
          </IonButtons>
          <IonTitle>Privacy Policy</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <h2>Privacy Policy</h2>
        <p>
          Your privacy is important to us. It is Spendlog's policy to respect your privacy regarding any information we may collect from you across our application.
        </p>
        <p>
          We only ask for personal information when we truly need it to provide a service to you. We collect it by fair and lawful means, with your knowledge and consent. We also let you know why we’re collecting it and how it will be used.
        </p>
        <p>
          Our app may link to external sites that are not operated by us. Please be aware that we have no control over the content and practices of these sites, and cannot accept responsibility or liability for their respective privacy policies.
        </p>
        <p>
          You are free to refuse our request for your personal information, with the understanding that we may be unable to provide you with some of your desired services.
        </p>
        <p>
          Your continued use of our app will be regarded as acceptance of our practices around privacy and personal information. If you have any questions about how we handle user data and personal information, feel free to contact us.
        </p>
        <p>This policy is effective as of 27 September 2025.</p>
      </IonContent>
    </IonPage>
  );
};

export default PrivacyPolicy;
