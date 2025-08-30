import React from 'react';
import EventRequestForm from '../components/EventRequestForm';

// Remplacer par la logique d'authentification réelle pour récupérer le nom du groupe connecté
const mockGroupName = 'NomDuGroupe';

const handleEventSubmit = (eventData: any) => {
  // Ici, vous pouvez envoyer les données à votre backend ou à Supabase
  console.log('Demande d’événement soumise :', eventData);
  alert('Demande d’événement soumise !');
};

const EventRequestPage: React.FC = () => {
  return (
    <EventRequestForm onSubmit={handleEventSubmit} groupName={mockGroupName} />
  );
};

export default EventRequestPage;
