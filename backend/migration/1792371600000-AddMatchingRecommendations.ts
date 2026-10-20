import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

export class AddMatchingRecommendations1792371600000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasTable('matching_recommendations')) return;

    await queryRunner.createTable(
      new Table({
        name: 'matching_recommendations',
        columns: [
          { name: 'id', type: 'varchar', length: '36', isPrimary: true },
          { name: 'employee_id', type: 'varchar', length: '36' },
          { name: 'project_id', type: 'varchar', length: '36' },
          {
            name: 'sprint_id',
            type: 'varchar',
            length: '36',
            isNullable: true,
          },
          { name: 'skill_id', type: 'varchar', length: '36', isNullable: true },
          { name: 'hr_id', type: 'varchar', length: '36' },
          { name: 'pm_id', type: 'varchar', length: '36' },
          { name: 'note', type: 'text' },
          { name: 'decision_note', type: 'text', isNullable: true },
          {
            name: 'status',
            type: 'enum',
            enum: ['PROPOSED', 'ACCEPTED', 'REJECTED', 'ALLOCATED'],
            default: "'PROPOSED'",
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    for (const [columnNames, referencedTableName] of [
      [['employee_id'], 'users'],
      [['project_id'], 'projects'],
      [['sprint_id'], 'sprints'],
      [['skill_id'], 'skills'],
      [['hr_id'], 'users'],
      [['pm_id'], 'users'],
    ] as Array<[string[], string]>) {
      await queryRunner.createForeignKey(
        'matching_recommendations',
        new TableForeignKey({
          columnNames,
          referencedTableName,
          referencedColumnNames: ['id'],
          onDelete:
            columnNames[0] === 'sprint_id' || columnNames[0] === 'skill_id'
              ? 'SET NULL'
              : 'RESTRICT',
        }),
      );
    }

    await queryRunner.createIndex(
      'matching_recommendations',
      new TableIndex({
        name: 'IDX_matching_recommendations_pm_status',
        columnNames: ['pm_id', 'status'],
      }),
    );

    await queryRunner.createIndex(
      'matching_recommendations',
      new TableIndex({
        name: 'IDX_matching_recommendations_hr_created',
        columnNames: ['hr_id', 'created_at'],
      }),
    );

    await queryRunner.createIndex(
      'matching_recommendations',
      new TableIndex({
        name: 'IDX_matching_recommendations_scope_status',
        columnNames: ['employee_id', 'project_id', 'sprint_id', 'status'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasTable('matching_recommendations')) {
      await queryRunner.dropTable('matching_recommendations');
    }
  }
}
