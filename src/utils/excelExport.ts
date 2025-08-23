import * as XLSX from 'xlsx';
import { YouthData } from '../types';

export class ExcelExportService {
  
  static exportAllRegistrations(registrations: YouthData[], filename: string = 'inscriptions-jeunesse.xlsx') {
    const worksheet = XLSX.utils.json_to_sheet(
      registrations.map(youth => ({
        'Nom et Prénom': youth.nomPrenom,
        'Genre': youth.genre,
        'Tranche d\'âge': youth.trancheAge,
        'Quartier de résidence': youth.quartierResidence,
        'Contact 1': youth.contact1,
        'Contact 2': youth.contact2 || '',
        'Statut matrimonial': youth.statutMatrimonial,
        'Situation professionnelle': youth.situationProfessionnelle,
        'Type de travail': youth.typeTravail || '',
        'Niveau d\'étude': youth.niveauEtude,
        'Année de conversion': youth.anneeConversion,
        'Baptême d\'eau': youth.baptemeEau,
        'Baptême Saint-Esprit': youth.baptemeSaintEsprit,
        'Message jeunesse': youth.messageJeunesse || '',
        'Groupe assigné': youth.groupeAssigne,
        'Date d\'inscription': new Date(youth.dateInscription).toLocaleDateString('fr-FR')
      }))
    );

    // Ajuster la largeur des colonnes
    const columnWidths = [
      { wch: 25 }, // Nom et Prénom
      { wch: 10 }, // Genre
      { wch: 12 }, // Tranche d'âge
      { wch: 20 }, // Quartier
      { wch: 15 }, // Contact 1
      { wch: 15 }, // Contact 2
      { wch: 15 }, // Statut matrimonial
      { wch: 18 }, // Situation professionnelle
      { wch: 15 }, // Type de travail
      { wch: 18 }, // Niveau d'étude
      { wch: 15 }, // Année de conversion
      { wch: 12 }, // Baptême d'eau
      { wch: 15 }, // Baptême Saint-Esprit
      { wch: 30 }, // Message jeunesse
      { wch: 20 }, // Groupe assigné
      { wch: 15 }  // Date d'inscription
    ];
    
    worksheet['!cols'] = columnWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Inscriptions');

    // Ajouter une feuille de statistiques
    this.addStatsSheet(workbook, registrations);

    XLSX.writeFile(workbook, filename);
  }

  static exportGroupData(groupMembers: YouthData[], groupName: string) {
    const filename = `groupe-${groupName.toLowerCase().replace(/[^a-z0-9]/g, '-')}.xlsx`;
    
    const worksheet = XLSX.utils.json_to_sheet(
      groupMembers.map(youth => ({
        'Nom et Prénom': youth.nomPrenom,
        'Genre': youth.genre,
        'Tranche d\'âge': youth.trancheAge,
        'Quartier de résidence': youth.quartierResidence,
        'Contact 1': youth.contact1,
        'Contact 2': youth.contact2 || '',
        'Statut matrimonial': youth.statutMatrimonial,
        'Situation professionnelle': youth.situationProfessionnelle,
        'Type de travail': youth.typeTravail || '',
        'Niveau d\'étude': youth.niveauEtude,
        'Année de conversion': youth.anneeConversion,
        'Baptême d\'eau': youth.baptemeEau,
        'Baptême Saint-Esprit': youth.baptemeSaintEsprit,
        'Message jeunesse': youth.messageJeunesse || '',
        'Date d\'inscription': new Date(youth.dateInscription).toLocaleDateString('fr-FR')
      }))
    );

    // Ajuster la largeur des colonnes
    const columnWidths = [
      { wch: 25 }, // Nom et Prénom
      { wch: 10 }, // Genre
      { wch: 12 }, // Tranche d'âge
      { wch: 20 }, // Quartier
      { wch: 15 }, // Contact 1
      { wch: 15 }, // Contact 2
      { wch: 15 }, // Statut matrimonial
      { wch: 18 }, // Situation professionnelle
      { wch: 15 }, // Type de travail
      { wch: 18 }, // Niveau d'étude
      { wch: 15 }, // Année de conversion
      { wch: 12 }, // Baptême d'eau
      { wch: 15 }, // Baptême Saint-Esprit
      { wch: 30 }, // Message jeunesse
      { wch: 15 }  // Date d'inscription
    ];
    
    worksheet['!cols'] = columnWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, `Groupe ${groupName}`);

    // Ajouter les statistiques du groupe
    this.addGroupStatsSheet(workbook, groupMembers, groupName);

    XLSX.writeFile(workbook, filename);
  }

  private static addStatsSheet(workbook: XLSX.WorkBook, registrations: YouthData[]) {
    const stats = this.calculateGlobalStats(registrations);
    
    const statsData = [
      ['STATISTIQUES GÉNÉRALES', ''],
      ['', ''],
      ['Total des inscriptions', registrations.length],
      ['', ''],
      ['RÉPARTITION PAR GENRE', ''],
      ['Hommes', stats.hommes],
      ['Femmes', stats.femmes],
      ['', ''],
      ['RÉPARTITION PAR ÂGE', ''],
      ['13-17 ans', stats.age['13-17'] || 0],
      ['18-24 ans', stats.age['18-24'] || 0],
      ['25-30 ans', stats.age['25-30'] || 0],
      ['31-40 ans', stats.age['31-40'] || 0],
      ['41+ ans', stats.age['41+'] || 0],
      ['', ''],
      ['STATUT MATRIMONIAL', ''],
      ['Mariés', stats.statut['Marié(e)'] || 0],
      ['Célibataires', stats.statut['Célibataire'] || 0],
      ['Veufs', stats.statut['Veuf(ve)'] || 0],
      ['Fiancés', stats.statut['Fiancé(e)'] || 0],
      ['Concubinage', stats.statut['Concubinage'] || 0],
      ['', ''],
      ['SITUATION PROFESSIONNELLE', ''],
      ['Travailleurs', stats.profession['Travailleur'] || 0],
      ['Étudiants', stats.profession['Étudiant(e)'] || 0],
      ['Sans emploi', stats.profession['Sans emploi'] || 0],
      ['', ''],
      ['RÉPARTITION PAR GROUPE', ''],
      ...Object.entries(stats.groupes).map(([groupe, count]) => [groupe, count])
    ];

    const statsWorksheet = XLSX.utils.aoa_to_sheet(statsData);
    statsWorksheet['!cols'] = [{ wch: 30 }, { wch: 15 }];
    
    XLSX.utils.book_append_sheet(workbook, statsWorksheet, 'Statistiques');
  }

  private static addGroupStatsSheet(workbook: XLSX.WorkBook, groupMembers: YouthData[], groupName: string) {
    const stats = this.calculateGroupStats(groupMembers);
    
    const statsData = [
      [`STATISTIQUES - GROUPE ${groupName.toUpperCase()}`, ''],
      ['', ''],
      ['Total des membres', groupMembers.length],
      ['', ''],
      ['RÉPARTITION PAR GENRE', ''],
      ['Hommes', stats.hommes],
      ['Femmes', stats.femmes],
      ['', ''],
      ['RÉPARTITION PAR ÂGE', ''],
      ['13-17 ans', stats.age['13-17'] || 0],
      ['18-24 ans', stats.age['18-24'] || 0],
      ['25-30 ans', stats.age['25-30'] || 0],
      ['31-40 ans', stats.age['31-40'] || 0],
      ['41+ ans', stats.age['41+'] || 0],
      ['', ''],
      ['STATUT MATRIMONIAL', ''],
      ['Mariés', stats.statut['Marié(e)'] || 0],
      ['Célibataires', stats.statut['Célibataire'] || 0],
      ['Veufs', stats.statut['Veuf(ve)'] || 0],
      ['Fiancés', stats.statut['Fiancé(e)'] || 0],
      ['Concubinage', stats.statut['Concubinage'] || 0],
      ['', ''],
      ['SITUATION PROFESSIONNELLE', ''],
      ['Travailleurs', stats.profession['Travailleur'] || 0],
      ['Étudiants', stats.profession['Étudiant(e)'] || 0],
      ['Sans emploi', stats.profession['Sans emploi'] || 0]
    ];

    const statsWorksheet = XLSX.utils.aoa_to_sheet(statsData);
    statsWorksheet['!cols'] = [{ wch: 30 }, { wch: 15 }];
    
    XLSX.utils.book_append_sheet(workbook, statsWorksheet, 'Statistiques');
  }

  private static calculateGlobalStats(registrations: YouthData[]) {
    const stats = {
      hommes: 0,
      femmes: 0,
      age: {} as Record<string, number>,
      statut: {} as Record<string, number>,
      profession: {} as Record<string, number>,
      groupes: {} as Record<string, number>
    };

    registrations.forEach(youth => {
      // Genre
      if (youth.genre === 'Homme') stats.hommes++;
      else stats.femmes++;

      // Âge
      stats.age[youth.trancheAge] = (stats.age[youth.trancheAge] || 0) + 1;

      // Statut matrimonial
      stats.statut[youth.statutMatrimonial] = (stats.statut[youth.statutMatrimonial] || 0) + 1;

      // Profession
      stats.profession[youth.situationProfessionnelle] = (stats.profession[youth.situationProfessionnelle] || 0) + 1;

      // Groupes
      if (youth.groupeAssigne) {
        stats.groupes[youth.groupeAssigne] = (stats.groupes[youth.groupeAssigne] || 0) + 1;
      }
    });

    return stats;
  }

  private static calculateGroupStats(groupMembers: YouthData[]) {
    const stats = {
      hommes: 0,
      femmes: 0,
      age: {} as Record<string, number>,
      statut: {} as Record<string, number>,
      profession: {} as Record<string, number>
    };

    groupMembers.forEach(youth => {
      // Genre
      if (youth.genre === 'Homme') stats.hommes++;
      else stats.femmes++;

      // Âge
      stats.age[youth.trancheAge] = (stats.age[youth.trancheAge] || 0) + 1;

      // Statut matrimonial
      stats.statut[youth.statutMatrimonial] = (stats.statut[youth.statutMatrimonial] || 0) + 1;

      // Profession
      stats.profession[youth.situationProfessionnelle] = (stats.profession[youth.situationProfessionnelle] || 0) + 1;
    });

    return stats;
  }
}