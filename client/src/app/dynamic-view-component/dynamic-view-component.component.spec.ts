import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DynamicViewComponentComponent } from './dynamic-view-component.component';

describe('DynamicViewComponentComponent', () => {
  let component: DynamicViewComponentComponent;
  let fixture: ComponentFixture<DynamicViewComponentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DynamicViewComponentComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DynamicViewComponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
