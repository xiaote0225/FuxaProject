import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HtmlReverseControlComponent } from './html-reverse-control.component';

describe('HtmlReverseControlComponent', () => {
  let component: HtmlReverseControlComponent;
  let fixture: ComponentFixture<HtmlReverseControlComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ HtmlReverseControlComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(HtmlReverseControlComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
