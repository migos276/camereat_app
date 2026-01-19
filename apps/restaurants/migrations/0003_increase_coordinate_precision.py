# Generated migration for increasing coordinate precision

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('restaurants', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='restaurant',
            name='latitude',
            field=models.DecimalField(
                blank=True,
                decimal_places=7,
                max_digits=10,
                null=True,
                help_text='Latitude coordinate with higher precision'
            ),
        ),
        migrations.AlterField(
            model_name='restaurant',
            name='longitude',
            field=models.DecimalField(
                blank=True,
                decimal_places=7,
                max_digits=10,
                null=True,
                help_text='Longitude coordinate with higher precision'
            ),
        ),
    ]

