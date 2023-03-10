import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import {FlexInputComponent} from './flex-input.component';

describe('FlexInputComponent', () => {
  let component: FlexInputComponent;
  let fixture: ComponentFixture<FlexInputComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [FlexInputComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FlexInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
