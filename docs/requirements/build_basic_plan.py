"""Build the requested basic one-table Word plan, without implementation status or technical detail."""
from pathlib import Path
from docx import Document
from docx.shared import Cm,Pt
from docx.oxml import OxmlElement
from docx.oxml.ns import qn

ROOT=Path(__file__).resolve().parent
ROWS=[
 (1,'Жобаны таңдау','Жобаның тақырыбы мен мақсатын анықтау.'),
 (2,'Алдын ала талдау','Пәндік саланы және ұқсас жобаларды зерттеу.'),
 (3,'Талаптарды анықтау','Жобаға қойылатын негізгі талаптарды тұжырымдау.'),
 (4,'Техникалық тапсырма','Техникалық тапсырманы дайындау.'),
 (5,'Жобалау','Жүйенің жалпы құрылымы мен интерфейсін жоспарлау.'),
 (6,'Деректер базасы','Деректер базасының құрылымын әзірлеу.'),
 (7,'Интерфейсті әзірлеу','Қолданбаның негізгі беттерін жасау.'),
 (8,'Негізгі қызметтер','Жүйенің негізгі қызметтерін әзірлеу.'),
 (9,'Бөліктерді біріктіру','Жүйенің бөліктерін өзара байланыстыру.'),
 (10,'Жұмысты тексеру','Негізгі мүмкіндіктердің жұмысын тексеру.'),
 (11,'Түзету','Анықталған қателерді түзету.'),
 (12,'Жетілдіру','Жобаның жұмысын жетілдіру және толықтыру.'),
 (13,'Құжаттаманы дайындау','Есеп пен пайдаланушы нұсқаулығын дайындау.'),
 (14,'Алдын ала қорғау','Жобаны алдын ала көрсету және ескертулерді ескеру.'),
 (15,'Қорытынды қорғау','Дайын жобаны тапсыру және қорғау.'),
]

def main():
    doc=Document();sec=doc.sections[0]
    sec.page_width=Cm(21);sec.page_height=Cm(29.7)
    sec.top_margin=Cm(1.8);sec.bottom_margin=Cm(1.8);sec.left_margin=Cm(1.8);sec.right_margin=Cm(1.8)
    normal=doc.styles['Normal'];normal.font.name='Times New Roman';normal.font.size=Pt(11)
    normal.paragraph_format.space_after=Pt(3)
    heading=doc.add_paragraph();heading.alignment=1
    run=heading.add_run('ADENLY ЖОБАСЫНЫҢ АПТАЛЫҚ ЖОСПАРЫ');run.bold=True;run.font.size=Pt(14)
    doc.add_paragraph('Ұзақтығы: 15 апта. Ағымдағы кезең: 10-апта.')
    table=doc.add_table(rows=1,cols=3);table.style='Table Grid';table.autofit=False
    widths=[Cm(1.5),Cm(5.1),Cm(10.7)]
    for col,width in zip(table.columns,widths):col.width=width
    for cell,label in zip(table.rows[0].cells,['Апта','Жұмыс кезеңі','Жалпы жұмыс мазмұны']):
        cell.text=label
        for run in cell.paragraphs[0].runs:run.bold=True
    repeat=OxmlElement('w:tblHeader');table.rows[0]._tr.get_or_add_trPr().append(repeat)
    for week,stage,work in ROWS:
        cells=table.add_row().cells
        for cell,text,width in zip(cells,[str(week),stage,work],widths):
            cell.width=width;cell.text=text
            for para in cell.paragraphs:
                para.paragraph_format.space_before=Pt(3);para.paragraph_format.space_after=Pt(3)
        if week==10:
            for cell in cells:
                shade=OxmlElement('w:shd');shade.set(qn('w:fill'),'FFF2CC');cell._tc.get_or_add_tcPr().append(shade)
    doc.save(ROOT/'Adenly_Aptalyk_zhospar.docx')
    md='# Adenly — базалық 15 апталық жоспар\n\nАғымдағы кезең: **10-апта**.\n\n'
    md+='[Word файлын жүктеу](https://github.com/Arnurzhairbek/Adenly/raw/refs/heads/main/docs/requirements/Adenly_Aptalyk_zhospar.docx)\n\n'
    md+='| Апта | Жұмыс кезеңі | Жалпы жұмыс мазмұны |\n|---|---|---|\n'
    for week,stage,work in ROWS:md+=f'| {week} | {stage} | {work} |\n'
    (ROOT/'basic_weekly_plan.md').write_text(md,encoding='utf-8')
    assert len(doc.tables)==1 and len(doc.tables[0].rows)==16
    print('Basic Word plan: one table, 15 weeks, current week 10.')

if __name__=='__main__':main()
