#!/usr/bin/env python
"""
Script de diagnostic pour tester l'endpoint livreurs/revenus/
Utile pour vérifier que les données sont correctement retournées
"""

import os
import sys
import django

# Setup Django
sys.path.insert(0, '/home/migos/Bureau/FOTSO/Nouveau dossier/final')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
django.setup()

from django.contrib.auth import get_user_model
from apps.livreurs.models import Livreur
from apps.orders.models import Commande
from datetime import datetime, timedelta
from django.utils import timezone
from django.db.models import Sum, Count

def test_endpoint(user_id=None):
    """Test l'endpoint des revenus pour un utilisateur"""
    print("=" * 60)
    print("DIAGNOSTIC - Endpoint livreurs/revenus/")
    print("=" * 60)
    
    User = get_user_model()
    
    # Trouver un utilisateur livreur
    if user_id:
        users = User.objects.filter(id=user_id, user_type='LIVREUR')
    else:
        users = User.objects.filter(user_type='LIVREUR')
    
    if not users.exists():
        print("❌ Aucun utilisateur livreur trouvé!")
        return
    
    user = users.first()
    print(f"\n📋 Utilisateur testé: {user.email} (ID: {user.id})")
    
    # Vérifier le profil livreur
    try:
        livreur = user.livreur
        print(f"✅ Profil livreur trouvé (ID: {livreur.id})")
    except Livreur.DoesNotExist:
        print("❌ Profil livreur NON TROUVÉ!")
        print("   → L'endpoint retournera des données par défaut (zéros)")
        
        # Afficher les données par défaut qui seront retournées
        today = timezone.now().date()
        french_days = {
            'Monday': 'Lundi', 'Tuesday': 'Mardi', 'Wednesday': 'Mercredi',
            'Thursday': 'Jeudi', 'Friday': 'Vendredi', 'Saturday': 'Samedi', 'Sunday': 'Dimanche'
        }
        daily_data = []
        for i in range(7):
            day_date = today - timedelta(days=i)
            daily_data.append({
                'date': str(day_date),
                'day_name': french_days.get(day_date.strftime('%A'), day_date.strftime('%A')),
                'earnings': 0,
                'deliveries': 0
            })
        
        print("\n📊 Données par défaut qui seront retournées:")
        print({
            'total_earnings_week': 0,
            'total_earnings_month': 0,
            'deliveries_week': 0,
            'bonuses': 0,
            'daily_breakdown': daily_data,
            'weekly_goal': 25,
            'weekly_goal_progress': 0,
            'average_rating': 4.5,
            'average_delivery_time': 22,
            'completion_rate': 0.95
        })
        return
    
    # Analyser les commandes du livreur
    print(f"\n📦 Analyse des commandes pour le livreur {livreur.id}:")
    
    # Commandes totales
    total_orders = Commande.objects.filter(livreur=livreur).count()
    print(f"   Total commandes: {total_orders}")
    
    # Commandes livrées
    delivered_orders = Commande.objects.filter(livreur=livreur, status='LIVREE')
    delivered_count = delivered_orders.count()
    print(f"   Commandes livrées: {delivered_count}")
    
    # Revenus totaux
    total_earnings = delivered_orders.aggregate(total=Sum('livreur_earnings'))['total']
    print(f"   Revenus totaux: {total_earnings or 0} XOF")
    
    # Cette semaine
    today = timezone.now().date()
    start_of_week = today - timedelta(days=today.weekday())
    end_of_week = start_of_week + timedelta(days=6)
    
    weekly_orders = delivered_orders.filter(
        date_delivered__date__gte=start_of_week,
        date_delivered__date__lte=end_of_week
    )
    weekly_count = weekly_orders.count()
    weekly_earnings = weekly_orders.aggregate(total=Sum('livreur_earnings'))['total']
    
    print(f"\n📅 Cette semaine ({start_of_week} au {end_of_week}):")
    print(f"   Commandes: {weekly_count}")
    print(f"   Revenus: {weekly_earnings or 0} XOF")
    
    # Analyse des daily breakdown
    print(f"\n📊 Daily breakdown (7 derniers jours):")
    for i in range(7):
        day_date = today - timedelta(days=i)
        day_start = datetime.combine(day_date, datetime.min.time())
        day_end = datetime.combine(day_date, datetime.max.time())
        
        day_orders = delivered_orders.filter(
            date_delivered__gte=day_start,
            date_delivered__lte=day_end
        )
        
        day_earnings = day_orders.aggregate(total=Sum('livreur_earnings'))['total']
        day_count = day_orders.count()
        
        day_name = day_date.strftime('%A')
        french_days = {
            'Monday': 'Lundi', 'Tuesday': 'Mardi', 'Wednesday': 'Mercredi',
            'Thursday': 'Jeudi', 'Friday': 'Vendredi', 'Saturday': 'Samedi', 'Sunday': 'Dimanche'
        }
        french_name = french_days.get(day_name, day_name)
        
        print(f"   {french_name} {day_date}: {day_count} cmd, {day_earnings or 0} XOF")
    
    # Statistiques de performance
    print(f"\n📈 Statistiques de performance:")
    print(f"   Note moyenne: {livreur.average_rating or 'Non définie'}")
    print(f"   Total livraisons: {livreur.delivery_count or 0}")
    
    # Résumé
    print("\n" + "=" * 60)
    print("RÉSUMÉ")
    print("=" * 60)
    
    if weekly_count == 0:
        print("⚠️  Aucune commande livrée cette semaine!")
        print("   → L'endpoint retournera 0 pour les revenus de la semaine")
        print("   → Les daily_breakdown montreront 0 pour chaque jour")
    else:
        print(f"✅ Données disponibles pour cette semaine:")
        print(f"   - Revenus semaine: {weekly_earnings or 0} XOF")
        print(f"   - Livraisons semaine: {weekly_count}")
        print(f"   - L'endpoint devrait retourner ces données correctement")
    
    print("\n💡 Pour tester l'endpoint directement:")
    print(f"   curl -H 'Authorization: Bearer <TOKEN>' http://localhost:8000/api/livreurs/revenus/")
    print("=" * 60)

if __name__ == '__main__':
    user_id = None
    if len(sys.argv) > 1:
        try:
            user_id = int(sys.argv[1])
        except ValueError:
            print("Usage: python test_earnings_endpoint.py [user_id]")
            sys.exit(1)
    
    test_endpoint(user_id)

