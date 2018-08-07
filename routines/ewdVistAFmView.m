ewdVistAFmView ;
 ;
PKGFILES(SESSID) ;
 N INDB,PIEN,PI,PFX,RESULT,PKGLST
 K ^TMP("ewd",SESSID,"concept")
 S INDB="",PI=0
 S INDB=$O(^DIC(9.4,"B",INDB))
 I INDB'="" F  D  Q:INDB=""
 . S PIEN=$O(^DIC(9.4,"B",INDB,0))
 . Q:+PIEN'>0
 . S PFX=$$GET1^DIQ(9.4,PIEN_",",1)
 . I PFX="" S PFX=INDB
 . S RESULT(PI,"name")=PFX
 . S RESULT(PI,"key")=PFX
 . N CNT,FIND,DPNDNTFLS
 . S FIND=0,CNT=0
 . S FIND=$O(^DIC(9.4,PIEN,4,"B",FIND))
 . I +FIND>0 F  D  Q:+FIND'>0
 . . I $D(^DIC(FIND)) D
 . . . S RESULT(PI,"files",CNT,"key")=FIND
 . . . S RESULT(PI,"files",CNT,"name")=$P(^DIC(FIND,0),"^",1)
 . . . S RESULT(PI,"files",CNT,"url")="#"
 . . . S RESULT(PI,"files",CNT,"type")="P"
 . . . D GTDPNDNT(.DPNDNTFLS,FIND)
 . . . S CNT=CNT+1
 . . S FIND=$O(^DIC(9.4,PIEN,4,"B",FIND))
 . S FIND=0
 . S FIND=$O(^DIC(9.4,PIEN,4,"B",FIND))
 . I +FIND>0 F  D  Q:+FIND'>0
 . . K DPNDNTFLS(FIND)
 . . S FIND=$O(^DIC(9.4,PIEN,4,"B",FIND))
 . S FIND=0
 . S FIND=$O(DPNDNTFLS(FIND))
 . I +FIND>0 F  D  Q:+FIND'>0
 . . I $D(^DIC(FIND)) D
 . . . S RESULT(PI,"files",CNT,"key")=FIND
 . . . S RESULT(PI,"files",CNT,"name")=$P(^DIC(FIND,0),"^",1)
 . . . S RESULT(PI,"files",CNT,"url")="#"
 . . . S RESULT(PI,"files",CNT,"type")="S"
 . . . S CNT=CNT+1
 . . S FIND=$O(DPNDNTFLS(FIND))
 . S RESULT(PI,"files","length")=CNT
 . S RESULT(PI,"count")=CNT
 . S INDB=$O(^DIC(9.4,"B",INDB)),PI=PI+1
 S RESULT("length")=PI
 M ^TMP("ewd",SESSID,"concept")=RESULT
 Q ""
GTDPNDNT(RESULT,FILE)
 N IND,TYP,PFL
 Q:'$D(^DD(FILE))
 S IND=0
 S IND=$O(^DD(FILE,IND))
 I +IND>0 F  D  Q:+IND'>0
 . K FLARR
 . D FIELD^DID(FILE,IND,"N","TYPE;POINTER;MULTIPLE-VALUED;SPECIFIER","FLARR")
 . I $G(FLARR("MULTIPLE-VALUED"))="1" D
 . . D GTDPNDNT(.RESULT,+$G(FLARR("SPECIFIER")))
 . I FLARR("TYPE")="POINTER" D
 . . S PFL=$$RSLVFILE($G(FLARR("POINTER")))
 . . I +PFL>0 S RESULT(PFL)=""
 . I FLARR("TYPE")="VARIABLE-POINTER" D
 . . N VPFL
 . . S VPFL=0
 . . S VPFL=$O(^DD(FILE,IND,"V","B",VPFL))
 . . I +VPFL>0 F  D  Q:+VPFL'>0
 . . . S RESULT(VPFL)=""
 . . . S VPFL=$O(^DD(FILE,IND,"V","B",VPFL))
 . S IND=$O(^DD(FILE,IND))
 Q
RSLVFILE(INFILE)
 N FILE
 S FILE=""
 S FILE=$$TRIM^XLFSTR(INFILE)
 Q:FILE="" ""
 I FILE["(" D
 . S FILE=$P($G(@("^"_FILE_"0)")),"^",1)
 . S FILE=$$TRIM^XLFSTR(FILE)
 . I FILE'="" S FILE=$O(^DIC("B",FILE,0))
 Q:FILE'>0 ""
 Q FILE