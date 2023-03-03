import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SwitchPropertyComponent } from './switch-property.component';

describe('SwitchPropertyComponent', () => {
  let component: SwitchPropertyComponent;
  let fixture: ComponentFixture<SwitchPropertyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SwitchPropertyComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SwitchPropertyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
