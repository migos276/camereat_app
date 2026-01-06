# Generated migration for livreur_earnings field

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('orders', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='commande',
            name='livreur_earnings',
            field=models.DecimalField(decimal_places=2, default=0, max_digits=10),
        ),
    ]

